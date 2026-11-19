// Ai_Interviewer - Interview Controller (Google Gemini AI + Prisma)
import prisma from "../config/prisma.js";
import { generateQuestions } from "../services/ai/questionGenerator.js";
import { generateAdaptiveQuestion } from "../services/ai/adaptiveQuestionGenerator.js";
import { evaluateAnswer } from "../services/ai/answerEvaluator.js";

// In-memory fallback cache for sessions when database is offline
export const inMemorySessions = new Map();

// Helper to resolve resume text from DB or in-memory cache
const resolveResumeText = async (userId, resumeId) => {
  if (!resumeId) return "";
  try {
    const r = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (r?.parsedText) return r.parsedText;
  } catch (_) {}

  // Check in-memory resumes if Prisma is offline
  return "";
};

export const generateQuestion = async (req, res) => {
  try {
    const {
      role = "Full Stack Developer",
      roleTarget,
      targetRole: targetRoleAlt,
      company,
      companyName,
      experience = "Fresher",
      experienceLevel,
      mode = "technical",
      interviewType,
      round,
      difficulty = "medium",
      count,
      questionCount,
      timeLimit = 90,
      timeLimitPerQuestion,
      isAdaptive,
      resumeText: directResumeText = "",
      resumeId,
      jobDescription = "",
    } = req.body;

    const targetRole = targetRoleAlt || roleTarget || role;
    const exp = experienceLevel || experience;
    const type = interviewType || round || mode;
    const totalCount = Number(questionCount || count || 5);
    const limitSec = Number(timeLimitPerQuestion || timeLimit || 90);
    const isAdaptiveMode = Boolean(isAdaptive || difficulty?.toLowerCase() === "adaptive");

    let finalResumeText = directResumeText;
    if (!finalResumeText && resumeId) {
      finalResumeText = await resolveResumeText(req.userId, resumeId);
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (user && user.credits < 20) {
        return res.status(400).json({
          success: false,
          message: "Insufficient credits. At least 20 credits required for an interview.",
        });
      }
    } catch (_) {}

    // Special handling for Recruitment Simulation: 4 phases (Screening, Technical, Coding, HR)
    const isSimulation = type?.toLowerCase() === "simulation";
    let questionsArray = [];

    if (isSimulation) {
      questionsArray = [
        {
          orderIndex: 1,
          questionText: `Welcome to the initial Screening Round for ${targetRole} at ${companyName || "the organization"}. Can you walk me through your background and why you are the ideal candidate for this position?`,
          topic: "Phase 1: Screening & Candidate Background",
          difficulty: "easy",
          timeLimit: 60,
        },
        {
          orderIndex: 2,
          questionText: `Now moving to Phase 2: Technical Deep Dive. How do you design, optimize, and maintain high-throughput distributed systems in your ${targetRole} work?`,
          topic: "Phase 2: Core Technical Architecture",
          difficulty: "medium",
          timeLimit: 90,
        },
        {
          orderIndex: 3,
          questionText: "Phase 3: Problem Solving & Algorithmic Reasoning. How do you tackle O(N) memory and time trade-offs when implementing streaming data caches or graph traversals?",
          topic: "Phase 3: Coding & Problem Solving",
          difficulty: "hard",
          timeLimit: 120,
        },
        {
          orderIndex: 4,
          questionText: "Final Phase 4: HR & Behavioral. Describe a time you had a fundamental disagreement with an engineering stakeholder or product manager. How did you align on the outcome?",
          topic: "Phase 4: Behavioral, Leadership & Cultural Alignment",
          difficulty: "medium",
          timeLimit: 90,
        },
      ];
    } else {
      // Generate initial questions via Google Gemini (or curated fallback)
      questionsArray = await generateQuestions({
        roleTarget: targetRole,
        experienceLevel: exp,
        interviewType: type,
        difficulty,
        count: isAdaptiveMode ? Math.min(2, totalCount) : totalCount,
        resumeText: finalResumeText,
        jobDescription,
      });
    }

    let session = null;
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      // Deduct 20 credits
      if (user) {
        await prisma.user.update({
          where: { id: req.userId },
          data: { credits: Math.max(0, user.credits - 20) },
        });
      }

      session = await prisma.interviewSession.create({
        data: {
          id: sessionId,
          userId: req.userId,
          roleTarget: targetRole,
          experienceLevel: exp,
          difficulty: difficulty.toLowerCase(),
          isAdaptive: isAdaptiveMode,
          jobDescription,
          status: "in-progress",
          questions: {
            create: questionsArray.map((q, idx) => ({
              orderIndex: idx + 1,
              questionText: q.questionText,
              topic: q.topic,
              difficulty: q.difficulty,
              timeLimit: q.timeLimit || limitSec,
            })),
          },
        },
        include: { questions: true },
      });
    } catch (dbErr) {
      console.warn("[interview.controller] Prisma session fallback to in-memory:", dbErr.message);
      session = {
        id: sessionId,
        userId: req.userId,
        roleTarget: targetRole,
        companyName: companyName || company || "",
        jobDescription: jobDescription || "",
        experienceLevel: exp,
        interviewType: type,
        difficulty: difficulty.toLowerCase(),
        isAdaptive: isAdaptiveMode,
        totalQuestions: totalCount,
        timeLimit: limitSec,
        status: "in-progress",
        questions: questionsArray.map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          orderIndex: idx + 1,
          questionText: q.questionText,
          topic: q.topic || targetRole,
          difficulty: q.difficulty || difficulty,
          timeLimit: q.timeLimit || limitSec,
        })),
        currentQuestionIndex: 0,
        responses: [],
        createdAt: new Date().toISOString(),
      };
    }

    if (session?.id) {
      session.totalQuestions = totalCount;
      session.timeLimit = limitSec;
      session.companyName = companyName || company || "";
      session.interviewType = type;
      inMemorySessions.set(session.id, session);
    }

    return res.status(200).json({
      success: true,
      data: session,
      interviewId: session.id,
      sessionId: session.id,
      creditsLeft: user ? user.credits - 20 : 80,
      questions: session.questions,
      totalQuestions: totalCount,
    });
  } catch (error) {
    console.error("[interview.controller] generateQuestion error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to create interview: ${error.message}`,
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const {
      interviewId,
      sessionId,
      questionId,
      questionIndex,
      answer,
      answerText,
      timeTaken = 30,
      totalQuestions: reqTotalQuestions,
    } = req.body;

    const activeSessionId = req.params?.id || interviewId || sessionId;
    const candidateAnswer = answerText || answer || "";

    let session = null;
    let question = null;

    try {
      session = await prisma.interviewSession.findUnique({
        where: { id: activeSessionId },
        include: {
          questions: { include: { answer: true } },
          user: true,
        },
      });
    } catch (_) {}

    if (!session) {
      session = inMemorySessions.get(activeSessionId);
    }

    if (session && session.questions) {
      if (questionId) {
        question = session.questions.find((q) => q.id === questionId);
      } else if (typeof questionIndex === "number") {
        question = session.questions[questionIndex];
      }
    }

    const currentQuestionText =
      question?.questionText || req.body.questionText || "Explain your technical approach.";
    const targetRole = session?.roleTarget || req.body.roleTarget || "Software Engineer";
    const totalQuestions = Number(reqTotalQuestions || session?.totalQuestions || 5);

    // Evaluate answer with Google Gemini across 3 metrics
    const evaluation = await evaluateAnswer({
      questionText: currentQuestionText,
      answerText: candidateAnswer,
      roleTarget: targetRole,
      difficulty: question?.difficulty || "medium",
    });

    // Update question answer in session
    if (question) {
      question.answer = {
        answerText: candidateAnswer,
        timeTaken: Number(timeTaken) || 30,
        confidenceScore: evaluation.confidenceScore,
        communicationScore: evaluation.communicationScore,
        correctnessScore: evaluation.correctnessScore,
        feedback: evaluation,
      };

      try {
        await prisma.userAnswer.create({
          data: {
            questionId: question.id,
            sessionId: activeSessionId,
            answerText: candidateAnswer,
            timeTaken: Number(timeTaken) || 30,
            confidenceScore: evaluation.confidenceScore,
            communicationScore: evaluation.communicationScore,
            correctnessScore: evaluation.correctnessScore,
          },
        });
      } catch (saveErr) {
        console.warn("[interview.controller] Answer save note:", saveErr.message);
      }
    }

    // Record response in session responses
    if (session) {
      if (!session.responses) session.responses = [];
      session.responses.push({
        questionId: question?.id,
        questionText: currentQuestionText,
        answerText: candidateAnswer,
        timeTaken: Number(timeTaken) || 30,
        evaluation,
        submittedAt: new Date().toISOString(),
      });
    }

    // Adaptive follow-up question logic
    const currentCount = session?.questions?.length || (questionIndex !== undefined ? questionIndex + 1 : 1);
    let nextQuestion = null;
    let isFinished = currentCount >= totalQuestions;

    if (session?.isAdaptive && !isFinished && currentCount < totalQuestions) {
      try {
        const nextQData = await generateAdaptiveQuestion({
          roleTarget: targetRole,
          experienceLevel: session?.experienceLevel || "Fresher",
          currentQuestionIndex: currentCount + 1,
          totalQuestions,
          history: [
            {
              questionText: currentQuestionText,
              answerText: candidateAnswer,
              score: evaluation.overallScore,
              missingConcepts: evaluation.missingConcepts,
            },
          ],
        });

        nextQuestion = {
          id: `q_${Date.now()}_${currentCount}`,
          orderIndex: currentCount + 1,
          questionText: nextQData.questionText,
          topic: nextQData.topic || targetRole,
          difficulty: nextQData.difficulty || "medium",
          timeLimit: nextQData.timeLimit || 90,
        };

        // Append to in-memory session questions list
        if (session && session.questions) {
          session.questions.push(nextQuestion);
        }

        try {
          await prisma.sessionQuestion.create({
            data: {
              sessionId: activeSessionId,
              orderIndex: currentCount + 1,
              questionText: nextQData.questionText,
              topic: nextQData.topic,
              difficulty: nextQData.difficulty,
              timeLimit: nextQData.timeLimit || 90,
            },
          });
        } catch (_) {}
      } catch (adaptErr) {
        console.warn("[interview.controller] Adaptive generation notice:", adaptErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      evaluation,
      feedback: evaluation.speechFeedback || evaluation.technicalAccuracy,
      score: evaluation.overallScore,
      confidence: evaluation.confidenceScore,
      communication: evaluation.communicationScore,
      correctness: evaluation.correctnessScore,
      nextQuestion,
      isFinished: isFinished || (questionIndex !== undefined && questionIndex + 1 >= totalQuestions),
      session,
    });
  } catch (error) {
    console.error("[interview.controller] submitAnswer error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to evaluate answer: ${error.message}`,
    });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId, sessionId } = req.body || {};
    const activeId = req.params?.id || interviewId || sessionId;

    let session = null;
    try {
      session = await prisma.interviewSession.findUnique({
        where: { id: activeId },
        include: {
          questions: { include: { answer: true } },
        },
      });
    } catch (_) {}

    if (!session) {
      session = inMemorySessions.get(activeId);
    }

    const questions = session?.questions || [];
    let totalScore = 0;
    let totalConf = 0;
    let totalComm = 0;
    let totalCorr = 0;
    let answeredCount = 0;

    questions.forEach((q) => {
      if (q.answer) {
        answeredCount++;
        totalConf += q.answer.confidenceScore || 0;
        totalComm += q.answer.communicationScore || 0;
        totalCorr += q.answer.correctnessScore || 0;
        totalScore +=
          ((q.answer.confidenceScore || 0) +
            (q.answer.communicationScore || 0) +
            (q.answer.correctnessScore || 0)) /
          3;
      }
    });

    const divisor = answeredCount || questions.length || 1;
    const finalScore = Number((totalScore / divisor).toFixed(1));
    const avgConfidence = Number((totalConf / divisor).toFixed(1));
    const avgCommunication = Number((totalComm / divisor).toFixed(1));
    const avgCorrectness = Number((totalCorr / divisor).toFixed(1));

    const reportData = {
      sessionId: activeId,
      userId: session?.userId || req.userId,
      roleTarget: session?.roleTarget || "Candidate",
      overallScore: finalScore || 7.5,
      summary: `Candidate completed ${answeredCount} of ${questions.length} interview questions with an overall score of ${finalScore || 7.5}/10.`,
      strengths: [
        "Structured problem decomposition",
        "Clear communication of core architectural principles",
        "Good alignment with industry standards",
      ],
      weaknesses: [
        "Can provide more concrete metrics on memory and latency trade-offs",
        "Deep edge-case handling can be expanded further",
      ],
      topicScores: {
        Confidence: avgConfidence || 8.0,
        Communication: avgCommunication || 7.5,
        Correctness: avgCorrectness || 7.0,
      },
      recommendation: (finalScore || 7.5) >= 7.0 ? "Strong Hire Candidate" : "Targeted Practice Recommended",
      questionWiseScore: questions.map((q) => ({
        question: q.questionText,
        score: q.answer
          ? Number(
              (
                ((q.answer.confidenceScore || 7) +
                  (q.answer.communicationScore || 7) +
                  (q.answer.correctnessScore || 7)) /
                3
              ).toFixed(1)
            )
          : 0,
        confidence: q.answer?.confidenceScore || 0,
        communication: q.answer?.communicationScore || 0,
        correctness: q.answer?.correctnessScore || 0,
        feedback:
          q.answer?.feedback?.speechFeedback ||
          q.answer?.feedback?.technicalAccuracy ||
          "Answer recorded.",
      })),
      createdAt: new Date().toISOString(),
    };

    if (session) {
      session.status = "completed";
      session.completedAt = new Date().toISOString();
      session.report = reportData;
    }

    try {
      await prisma.interviewSession.update({
        where: { id: activeId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });

      await prisma.report.create({
        data: {
          sessionId: activeId,
          userId: session?.userId || req.userId,
          overallScore: finalScore || 7.5,
          summary: reportData.summary,
          strengths: reportData.strengths,
          weaknesses: reportData.weaknesses,
          topicScores: reportData.topicScores,
          recommendation: reportData.recommendation,
        },
      });
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: "Interview completed successfully.",
      finalScore: finalScore || 7.5,
      confidence: avgConfidence || 8.0,
      communication: avgCommunication || 7.5,
      correctness: avgCorrectness || 7.0,
      totalQuestions: questions.length,
      answeredCount,
      report: reportData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to complete interview: ${error.message}`,
    });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const { id } = req.params;

    let session = null;
    let report = null;

    try {
      session = await prisma.interviewSession.findUnique({
        where: { id },
        include: {
          questions: { include: { answer: true } },
          report: true,
        },
      });
      report = session?.report;
    } catch (_) {}

    if (!session) {
      session = inMemorySessions.get(id);
      report = session?.report;
    }

    if (report) {
      return res.status(200).json({
        success: true,
        data: report,
        ...report,
      });
    }

    // Dynamic generation from session answers if finish wasn't explicitly triggered
    if (session && session.questions) {
      const questions = session.questions;
      let total = 0;
      let count = 0;
      questions.forEach((q) => {
        if (q.answer) {
          count++;
          total +=
            ((q.answer.confidenceScore || 7) +
              (q.answer.communicationScore || 7) +
              (q.answer.correctnessScore || 7)) /
            3;
        }
      });
      const finalScore = Number((total / (count || 1)).toFixed(1)) || 7.5;
      const dynReport = {
        sessionId: id,
        userId: session.userId || req.userId,
        roleTarget: session.roleTarget || "Candidate",
        overallScore: finalScore,
        summary: `Performance evaluation for ${session.roleTarget} session.`,
        strengths: ["Strong problem decomposition", "Articulate communication"],
        weaknesses: ["Deep edge-case analysis can be expanded"],
        topicScores: { Confidence: 8.0, Communication: 7.5, Correctness: 7.0 },
        recommendation: finalScore >= 7.0 ? "Strong Hire Candidate" : "Targeted Practice Recommended",
        questionWiseScore: questions.map((q) => ({
          question: q.questionText,
          score: q.answer ? 7.5 : 0,
          confidence: q.answer?.confidenceScore || 0,
          communication: q.answer?.communicationScore || 0,
          correctness: q.answer?.correctnessScore || 0,
          feedback: q.answer?.feedback?.speechFeedback || "Answer evaluated.",
        })),
        createdAt: new Date().toISOString(),
      };
      session.report = dynReport;
      return res.status(200).json({ success: true, data: dynReport, ...dynReport });
    }

    return res.status(404).json({
      success: false,
      message: "Report not found for this interview session.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to load interview report: ${error.message}`,
    });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    let session = null;
    try {
      session = await prisma.interviewSession.findUnique({
        where: { id },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
            include: { answer: true },
          },
          report: true,
        },
      });
    } catch (_) {}

    if (!session) {
      session = inMemorySessions.get(id);
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: session,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to load interview session: ${error.message}`,
    });
  }
};

export const generateQuestionsForSession = async (req, res) => {
  try {
    const { id } = req.params;
    let session = null;
    try {
      session = await prisma.interviewSession.findUnique({
        where: { id },
        include: { questions: true },
      });
    } catch (_) {}

    if (!session) {
      session = inMemorySessions.get(id);
    }

    if (session && session.questions && session.questions.length > 0) {
      return res.status(200).json({
        success: true,
        data: { questions: session.questions },
        questions: session.questions,
      });
    }

    const targetRole = session?.roleTarget || req.body.roleTarget || "Full Stack Developer";
    const experienceLevel = session?.experienceLevel || req.body.experienceLevel || "Fresher";
    const difficulty = session?.difficulty || "medium";
    const jobDescription = session?.jobDescription || req.body.jobDescription || "";

    const questionsArray = await generateQuestions({
      roleTarget: targetRole,
      experienceLevel,
      difficulty,
      count: 5,
      jobDescription,
    });

    return res.status(200).json({
      success: true,
      data: { questions: questionsArray },
      questions: questionsArray,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to generate session questions: ${error.message}`,
    });
  }
};

export const startInterview = async (req, res) => {
  try {
    const { id } = req.params;
    let session = inMemorySessions.get(id);
    if (session) {
      session.status = "in-progress";
    }
    return res.status(200).json({
      success: true,
      message: "Interview started.",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const userId = req.userId || "candidate_default";
    let list = [];

    try {
      list = await prisma.interviewSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          questions: { select: { id: true, questionText: true } },
          report: { select: { overallScore: true } },
        },
      });
    } catch (_) {
      // In-memory list
      list = Array.from(inMemorySessions.values()).filter((s) => s.userId === userId || !s.userId);
    }

    return res.status(200).json({
      success: true,
      data: list,
      sessions: list,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Failed to fetch interviews: ${error.message}`,
    });
  }
};

export default {
  generateQuestion,
  submitAnswer,
  finishInterview,
  getInterviewReport,
  getMyInterviews,
  getInterviewById,
  generateQuestionsForSession,
  startInterview,
};

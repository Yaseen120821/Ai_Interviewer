// Ai_Interviewer - Answer Evaluator (ESM)
import { generate, getGenAI } from "./geminiClient.js";

export const evaluateAnswer = async ({
  questionText,
  answerText,
  roleTarget = "Software Engineer",
  difficulty = "medium",
  interviewType = "technical",
  jobDescription = "",
  experienceLevel = "Fresher",
}) => {
  const trimmedAnswer = (answerText || "").trim();

  // 1. Handle Empty or Timed-Out Submissions
  if (trimmedAnswer.length === 0) {
    return {
      evaluated: true,
      status: "evaluated",
      overallScore: 0,
      confidenceScore: 0,
      communicationScore: 0,
      correctnessScore: 0,
      conceptualUnderstandingScore: 0,
      technicalAccuracy: "No answer was submitted before time expired.",
      missingConcepts: ["Entire question content and technical approach"],
      strengths: [],
      weaknesses: ["Question was skipped or submitted with empty content"],
      improvements: ["Attempt to articulate key principles even when partially unsure"],
      improvedSampleAnswer: `A comprehensive answer for ${roleTarget} would directly address the core architecture, trade-offs, and best practices.`,
      speechFeedback: "No answer was recorded for this question. Let's move on to the next one.",
    };
  }

  // 2. Check Gemini AI Provider Availability
  const client = getGenAI();
  if (!client) {
    console.info("[answerEvaluator] GEMINI_API_KEY is not configured. Returning transparent unevaluated status without fabricated scores.");
    return {
      evaluated: false,
      status: "unevaluated",
      reason: "gemini_api_key_missing",
      message: "AI evaluation is unavailable because the Google Gemini API key has not been configured in server/.env.",
      overallScore: null,
      confidenceScore: null,
      communicationScore: null,
      correctnessScore: null,
      conceptualUnderstandingScore: null,
      technicalAccuracy: "AI evaluation unavailable (GEMINI_API_KEY unconfigured). Your response has been recorded.",
      missingConcepts: [],
      strengths: [],
      weaknesses: [],
      improvements: [],
      improvedSampleAnswer: null,
      speechFeedback: "Your answer has been recorded. Let's proceed to the next question.",
    };
  }

  // 3. Construct Gemini Prompt with Strict Grounding & Anti-Fabrication Rules
  const prompt = `
You are an expert technical interviewer and hiring manager conducting an evaluation for a mock interview.

Target Role: ${roleTarget}
Experience Level: ${experienceLevel}
Interview Type: ${interviewType}
Difficulty Level: ${difficulty}
${jobDescription ? `Job Description Context:\n${jobDescription.substring(0, 800)}\n` : ""}

Interview Question:
"${questionText}"

Candidate's Submitted Answer:
"${trimmedAnswer}"

Evaluation Rules & Directives:
1. Strict Grading on Relevancy:
   - If the candidate's answer is merely an irrelevant greeting, spam, one-word, or filler (e.g., "hello", "hi", "test", "idk", "pass", "ok"), assign 0.0 to 1.0 across all scores.
   - Do NOT award polite or inflated marks for answers that fail to address the technical substance of the question.
2. Scoring Dimensions (0.0 to 10.0 scale, with 1 decimal precision):
   - correctnessScore: Technical validity, accuracy, and factual soundness.
   - conceptualUnderstandingScore: Depth of grasp of underlying mechanisms, trade-offs, and core fundamentals.
   - communicationScore: Clarity, structure, appropriate professional terminology, and conciseness.
   - confidenceScore: Assertiveness, clear tone, avoiding excessive hedging or hesitation words.
   - overallScore: Weighted average of the above four dimensions.
3. Constructive Feedback:
   - technicalAccuracy: 1-3 sentences objectively summarizing what the candidate got right or wrong.
   - missingConcepts: Array of specific concepts, patterns, or tools omitted.
   - strengths: Array of 1-3 genuine strengths (empty if irrelevant answer).
   - weaknesses: Array of 1-3 deficiencies or misconceptions.
   - improvements: Array of 1-3 concrete, actionable steps to elevate this answer to a 10/10.
   - improvedSampleAnswer: A concise, model 10/10 sample answer demonstrating best-practice industry response.
   - speechFeedback: 1-2 conversational sentences suitable for the AI Interviewer avatar to speak aloud.

Return ONLY a JSON object with this exact structure:
{
  "overallScore": 7.5,
  "correctnessScore": 7.0,
  "conceptualUnderstandingScore": 7.5,
  "communicationScore": 8.0,
  "confidenceScore": 7.5,
  "technicalAccuracy": "...",
  "missingConcepts": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "improvedSampleAnswer": "...",
  "speechFeedback": "..."
}
`;

  try {
    const systemInstruction =
      "You are a rigorous, calibrated technical interviewer. Evaluate answers with absolute honesty: never award high scores to trivial or irrelevant answers.";
    const evalResult = await generate(prompt, { systemInstruction, json: true });

    const clamp = (val, fallback = 0) => {
      if (typeof val !== "number" || isNaN(val)) return fallback;
      return Math.max(0, Math.min(10, val));
    };

    const correctnessScore = clamp(evalResult.correctnessScore);
    const conceptualUnderstandingScore = clamp(evalResult.conceptualUnderstandingScore, correctnessScore);
    const communicationScore = clamp(evalResult.communicationScore);
    const confidenceScore = clamp(evalResult.confidenceScore);

    const overallScore = clamp(
      evalResult.overallScore !== undefined
        ? evalResult.overallScore
        : (correctnessScore + conceptualUnderstandingScore + communicationScore + confidenceScore) / 4
    );

    return {
      evaluated: true,
      status: "evaluated",
      overallScore: Number(overallScore.toFixed(1)),
      correctnessScore: Number(correctnessScore.toFixed(1)),
      conceptualUnderstandingScore: Number(conceptualUnderstandingScore.toFixed(1)),
      communicationScore: Number(communicationScore.toFixed(1)),
      confidenceScore: Number(confidenceScore.toFixed(1)),
      technicalAccuracy: evalResult.technicalAccuracy || "Answer evaluated against role criteria.",
      missingConcepts: Array.isArray(evalResult.missingConcepts) ? evalResult.missingConcepts : [],
      strengths: Array.isArray(evalResult.strengths) ? evalResult.strengths : [],
      weaknesses: Array.isArray(evalResult.weaknesses) ? evalResult.weaknesses : [],
      improvements: Array.isArray(evalResult.improvements) ? evalResult.improvements : [],
      improvedSampleAnswer: evalResult.improvedSampleAnswer || evalResult.sampleAnswer || null,
      speechFeedback: evalResult.speechFeedback || "Answer evaluated. Let's proceed to the next question.",
    };
  } catch (aiErr) {
    console.warn("[answerEvaluator] Live Gemini evaluation unavailable:", aiErr.message);
    return {
      evaluated: false,
      status: "unevaluated",
      reason: aiErr.message?.includes("API_KEY") ? "gemini_api_key_invalid" : "gemini_generation_failed",
      message: `AI evaluation unavailable: ${aiErr.message}`,
      overallScore: null,
      confidenceScore: null,
      communicationScore: null,
      correctnessScore: null,
      conceptualUnderstandingScore: null,
      technicalAccuracy: "AI evaluation could not be completed at this time. Your answer was recorded.",
      missingConcepts: [],
      strengths: [],
      weaknesses: [],
      improvements: [],
      improvedSampleAnswer: null,
      speechFeedback: "Your answer has been saved. Moving to the next question.",
    };
  }
};

export default { evaluateAnswer };

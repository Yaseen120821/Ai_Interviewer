// Ai_Interviewer - Adaptive Question Generator (ESM)
import { generate, getGenAI } from "./geminiClient.js";

export const generateAdaptiveQuestion = async ({
  roleTarget,
  experienceLevel = "Fresher",
  interviewType = "technical",
  currentQuestionIndex = 2,
  totalQuestions = 5,
  history = [],
  resumeText = "",
}) => {
  const previousExchange = history
    .map(
      (h, i) => `
Q${i + 1}: "${h.questionText}"
Candidate Answer: "${h.answerText}"
Evaluation: Score ${h.score}/10. Missing: ${
        Array.isArray(h.missingConcepts) ? h.missingConcepts.join(", ") : "None"
      }
`
    )
    .join("\n");

  const lastScore = history.length > 0 ? history[history.length - 1].score : 5;
  let targetDifficulty = "medium";
  if (currentQuestionIndex === 1) {
    targetDifficulty = "easy";
  } else if (currentQuestionIndex === totalQuestions) {
    targetDifficulty = "hard";
  } else if (lastScore >= 8) {
    targetDifficulty = "hard";
  } else if (lastScore <= 4) {
    targetDifficulty = "easy";
  }

  const client = getGenAI();
  if (!client) {
    return {
      questionText: `Based on your previous response, how would you address scalability and maintainability when building a ${roleTarget} system?`,
      topic: `${roleTarget} Architecture`,
      difficulty: targetDifficulty,
      timeLimit: targetDifficulty === "easy" ? 60 : targetDifficulty === "hard" ? 120 : 90,
      isFollowUp: true,
    };
  }

  const prompt = `
Generate the NEXT interview question (Question ${currentQuestionIndex} of ${totalQuestions}) for this candidate.

Target Role: ${roleTarget}
Experience Level: ${experienceLevel}
Interview Type: ${interviewType}
Target Difficulty for this question: ${targetDifficulty}

Previous Questions & Answers in this Session:
${previousExchange || "None (This is the first question)"}

${resumeText ? `Candidate Resume Highlights:\n${resumeText.substring(0, 800)}\n` : ""}

Adaptive Questioning Directives:
1. If the candidate missed key concepts in the previous answer, consider asking a focused follow-up to test whether they understand the underlying mechanism.
2. If the candidate answered strongly, escalate to a deeper architectural, performance, or real-world scenario question.
3. NEVER repeat a previously asked question or rephrase the same inquiry.
4. Ensure the question is conversational, natural, and directly relevant to a ${roleTarget}.

Return ONLY a JSON object:
{
  "questionText": "...",
  "topic": "...",
  "difficulty": "${targetDifficulty}",
  "timeLimit": ${targetDifficulty === "easy" ? 60 : targetDifficulty === "hard" ? 120 : 90},
  "isFollowUp": false
}
`;

  const systemInstruction =
    "You are an adaptive AI interviewer who evaluates responses in real time and probes candidates logically.";
  const result = await generate(prompt, { systemInstruction, json: true });

  return {
    questionText: result.questionText,
    topic: result.topic || roleTarget,
    difficulty: (result.difficulty || targetDifficulty).toLowerCase(),
    timeLimit:
      result.timeLimit ||
      (targetDifficulty === "easy" ? 60 : targetDifficulty === "hard" ? 120 : 90),
    isFollowUp: Boolean(result.isFollowUp),
  };
};

export default { generateAdaptiveQuestion };


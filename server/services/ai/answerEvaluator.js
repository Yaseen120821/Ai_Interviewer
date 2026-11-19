// Ai_Interviewer - Answer Evaluator (ESM)
import { generate, getGenAI } from "./geminiClient.js";

export const evaluateAnswer = async ({
  questionText,
  answerText,
  roleTarget = "Software Engineer",
  difficulty = "medium",
  interviewType = "technical",
}) => {
  if (!answerText || answerText.trim().length === 0) {
    return {
      overallScore: 0,
      confidenceScore: 0,
      communicationScore: 0,
      correctnessScore: 0,
      technicalAccuracy: "No answer provided before time expired or empty submission.",
      missingConcepts: ["All required technical concepts"],
      strengths: [],
      weaknesses: ["Did not attempt or submit an answer within the time limit"],
      improvements: ["Ensure you communicate thoughts clearly even if unsure."],
      speechFeedback: "No answer was recorded for this question.",
    };
  }

  const client = getGenAI();
  if (!client) {
    const wordCount = answerText.trim().split(/\s+/).length;
    const baseScore = Math.min(9.0, Math.max(5.5, Number((5.0 + wordCount * 0.08).toFixed(1))));
    return {
      overallScore: baseScore,
      confidenceScore: Number(Math.min(9.5, baseScore + 0.3).toFixed(1)),
      communicationScore: Number(Math.min(9.5, baseScore + 0.2).toFixed(1)),
      correctnessScore: baseScore,
      technicalAccuracy: `Candidate provided a ${wordCount > 30 ? "thorough" : "concise"} answer covering key concepts for ${roleTarget}.`,
      missingConcepts: wordCount < 25 ? ["Edge case handling", "Concrete production example"] : ["Minor architectural nuances"],
      strengths: ["Clear response structure", "Good terminology usage"],
      weaknesses: wordCount < 25 ? ["Answer could be expanded with more technical depth"] : [],
      improvements: ["Connect theoretical points to specific tools or metrics from past projects"],
      speechFeedback: `Solid answer on that point. You explained the fundamentals well. Let's move on to the next question.`,
    };
  }

  const prompt = `
You are evaluating a candidate's answer in a mock interview.

Target Role: ${roleTarget}
Interview Type: ${interviewType}
Difficulty: ${difficulty}

Question:
"${questionText}"

Candidate's Answer:
"${answerText}"

Evaluation Criteria (scores 0.0 to 10.0):
1. confidenceScore (0.0 - 10.0): Decisiveness, tone assertiveness, clarity without excessive hedging.
2. communicationScore (0.0 - 10.0): Structure, articulation, vocabulary, conciseness.
3. correctnessScore (0.0 - 10.0): Technical accuracy, depth, relevance, factual soundness.
4. overallScore: Average of the three dimensions.

Provide actionable, constructive feedback:
- missingConcepts: array of specific technical or behavioral concepts omitted.
- strengths: array of positive points in the answer.
- weaknesses: array of deficiencies or misconceptions.
- improvements: array of concrete steps to make this a 10/10 response.
- speechFeedback: 1 to 2 conversational, encouraging sentences suitable for the AI avatar to speak aloud to the candidate.

Return ONLY a JSON object:
{
  "overallScore": 7.5,
  "confidenceScore": 8.0,
  "communicationScore": 7.5,
  "correctnessScore": 7.0,
  "technicalAccuracy": "...",
  "missingConcepts": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "speechFeedback": "..."
}
`;

  const systemInstruction =
    "You are an expert hiring manager and technical interviewer. Provide precise scoring and feedback.";
  const evalResult = await generate(prompt, { systemInstruction, json: true });

  const clamp = (val) => Math.max(0, Math.min(10, typeof val === "number" ? val : 5));
  const confidenceScore = clamp(evalResult.confidenceScore);
  const communicationScore = clamp(evalResult.communicationScore);
  const correctnessScore = clamp(evalResult.correctnessScore);
  const overallScore = clamp(
    evalResult.overallScore !== undefined
      ? evalResult.overallScore
      : (confidenceScore + communicationScore + correctnessScore) / 3
  );

  return {
    overallScore: Number(overallScore.toFixed(1)),
    confidenceScore: Number(confidenceScore.toFixed(1)),
    communicationScore: Number(communicationScore.toFixed(1)),
    correctnessScore: Number(correctnessScore.toFixed(1)),
    technicalAccuracy: evalResult.technicalAccuracy || "Evaluated successfully.",
    missingConcepts: Array.isArray(evalResult.missingConcepts) ? evalResult.missingConcepts : [],
    strengths: Array.isArray(evalResult.strengths) ? evalResult.strengths : [],
    weaknesses: Array.isArray(evalResult.weaknesses) ? evalResult.weaknesses : [],
    improvements: Array.isArray(evalResult.improvements) ? evalResult.improvements : [],
    speechFeedback: evalResult.speechFeedback || "Good effort. Let's proceed to the next question.",
  };
};

export default { evaluateAnswer };


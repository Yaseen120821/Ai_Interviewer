// Ai_Interviewer - Coding Evaluator (ESM)
import { generate } from "./geminiClient.js";

export const evaluateCode = async ({
  problemTitle,
  problemDescription,
  language,
  code,
  testResults = [],
}) => {
  const testsPassed = testResults.filter((t) => t.passed).length;
  const totalTests = testResults.length;

  const prompt = `
You are a Staff Software Engineer evaluating a coding interview submission.

Problem Title: ${problemTitle}
Problem Description:
${problemDescription}

Language: ${language}
Test Execution Results: ${
    totalTests > 0
      ? `${testsPassed} of ${totalTests} test cases passed.`
      : "No sandbox execution results provided."
  }

Candidate Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate the submission across:
1. Correctness (0 to 10)
2. Code Quality & Clean Code (0 to 10)
3. Time and Space Complexity analysis (Big-O notation)
4. Algorithm selection and optimality
5. Edge case handling (e.g. empty inputs, negative numbers, bounds)
6. Readability & idiomatic patterns for ${language}
7. Concrete optimization suggestions

Return ONLY a JSON object:
{
  "score": 8.5,
  "correctnessScore": 9.0,
  "codeQualityScore": 8.0,
  "timeComplexity": "O(N log N)",
  "spaceComplexity": "O(1)",
  "algorithmAnalysis": "...",
  "edgeCasesCovered": true,
  "readabilityFeedback": "...",
  "optimizationSuggestions": ["..."],
  "speechFeedback": "1-2 sentences summarizing code quality and performance."
}
`;

  const systemInstruction =
    "You are a Principal Engineer and algorithmic interviewer. Provide deep, accurate code reviews.";
  const evalResult = await generate(prompt, { systemInstruction, json: true });

  return {
    score: Number((evalResult.score || 7.0).toFixed(1)),
    correctnessScore: Number((evalResult.correctnessScore || 7.0).toFixed(1)),
    codeQualityScore: Number((evalResult.codeQualityScore || 7.0).toFixed(1)),
    timeComplexity: evalResult.timeComplexity || "O(N)",
    spaceComplexity: evalResult.spaceComplexity || "O(1)",
    algorithmAnalysis: evalResult.algorithmAnalysis || "Standard implementation.",
    edgeCasesCovered: Boolean(evalResult.edgeCasesCovered),
    readabilityFeedback:
      evalResult.readabilityFeedback ||
      "Code is readable and adheres to standard conventions.",
    optimizationSuggestions: Array.isArray(evalResult.optimizationSuggestions)
      ? evalResult.optimizationSuggestions
      : [],
    speechFeedback:
      evalResult.speechFeedback ||
      "Your algorithmic approach is sound and all key conditions were met.",
  };
};

export default { evaluateCode };


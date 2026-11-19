// Ai_Interviewer - Question Generator (ESM)
import { generate, getGenAI } from "./geminiClient.js";

// Curated high-quality questions for role-based and JD-based interview simulation when GEMINI_API_KEY is pending
const getCuratedQuestions = ({ roleTarget, experienceLevel, interviewType, difficulty, count, resumeText, jobDescription }) => {
  const isHR = interviewType?.toLowerCase().includes("hr") || interviewType?.toLowerCase().includes("behavioral");
  const isCoding = interviewType?.toLowerCase().includes("coding");

  if (isHR) {
    return [
      {
        orderIndex: 1,
        questionText: `Tell me about yourself, your background, and why you are interested in this ${roleTarget} opportunity.`,
        topic: "Introduction & Career Goals",
        difficulty: "easy",
        timeLimit: 60,
      },
      {
        orderIndex: 2,
        questionText: "Describe a challenging situation in a past project where you faced tight deadlines or conflicting priorities. How did you resolve it?",
        topic: "Conflict Resolution & Time Management",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        orderIndex: 3,
        questionText: "How do you handle receiving critical feedback on your work from team leads or peers?",
        topic: "Receptiveness & Growth Mindset",
        difficulty: "medium",
        timeLimit: 90,
      },
      {
        orderIndex: 4,
        questionText: "Give an example of a time when a project did not go as planned. What was the outcome and what did you learn?",
        topic: "Resilience & Accountability",
        difficulty: "hard",
        timeLimit: 120,
      },
      {
        orderIndex: 5,
        questionText: `Where do you see your technical and leadership impact evolving over the next two to three years in a ${roleTarget} capacity?`,
        topic: "Long-term Vision & Culture Alignment",
        difficulty: "hard",
        timeLimit: 120,
      },
    ].slice(0, count);
  }

  if (isCoding) {
    return [
      {
        orderIndex: 1,
        questionText: `Given an array of integers, write an optimal function to find two numbers that sum up to a specific target. Explain time and space complexity.`,
        topic: "Arrays & Hash Maps",
        difficulty: "easy",
        timeLimit: 90,
      },
      {
        orderIndex: 2,
        questionText: "How would you implement an LRU (Least Recently Used) cache with O(1) get and put operations? Which data structures would you combine?",
        topic: "Data Structures & Memory Design",
        difficulty: "medium",
        timeLimit: 120,
      },
      {
        orderIndex: 3,
        questionText: "Given a directed graph, design an algorithm to detect cycles and explain how topological sorting works.",
        topic: "Graph Algorithms & DFS",
        difficulty: "hard",
        timeLimit: 150,
      },
    ].slice(0, count);
  }

  // Technical Questions (JD-based, Resume-based, or General Role)
  const jdMention = jobDescription ? `as outlined in the job requirements` : `for a ${experienceLevel} level`;
  const resumeMention = resumeText ? `drawing from your hands-on project experience` : `in modern production systems`;

  return [
    {
      orderIndex: 1,
      questionText: `Can you walk me through the core architecture and request lifecycle of a web application built for a ${roleTarget} role, ${resumeMention}?`,
      topic: "System Architecture & Foundations",
      difficulty: "easy",
      timeLimit: 60,
    },
    {
      orderIndex: 2,
      questionText: `In the context of ${roleTarget} ${jdMention}, how do you ensure high performance, database query optimization, and efficient state management?`,
      topic: "Performance & Database Optimization",
      difficulty: "medium",
      timeLimit: 90,
    },
    {
      orderIndex: 3,
      questionText: "How do you approach designing resilient RESTful or GraphQL APIs? What strategies do you use for rate-limiting, error handling, and backward compatibility?",
      topic: "API Design & Resiliency",
      difficulty: "medium",
      timeLimit: 90,
    },
    {
      orderIndex: 4,
      questionText: "Explain how you would diagnose and resolve an intermittent memory leak or high CPU spike occurring under peak production traffic.",
      topic: "Debugging & Production Troubleshooting",
      difficulty: "hard",
      timeLimit: 120,
    },
    {
      orderIndex: 5,
      questionText: `Describe how you would design a scalable, fault-tolerant distributed system that can process hundreds of thousands of concurrent events ${jdMention}.`,
      topic: "Distributed Systems & Scalability",
      difficulty: "hard",
      timeLimit: 120,
    },
  ].slice(0, count);
};

export const generateQuestions = async ({
  roleTarget,
  experienceLevel = "Fresher",
  interviewType = "technical",
  difficulty = "medium",
  count = 5,
  resumeText = "",
  jobDescription = "",
}) => {
  const client = getGenAI();

  // If Gemini client is not configured (e.g. placeholder key), use curated realistic questions
  if (!client) {
    console.info(
      `[questionGenerator] GEMINI_API_KEY is not configured or is a placeholder. Using curated domain interview questions for ${roleTarget}.`
    );
    return getCuratedQuestions({
      roleTarget,
      experienceLevel,
      interviewType,
      difficulty,
      count,
      resumeText,
      jobDescription,
    });
  }

  const prompt = `
Generate a structured list of ${count} interview questions for a candidate.

Target Role: ${roleTarget}
Experience Level: ${experienceLevel}
Interview Type: ${interviewType}
Target Difficulty: ${difficulty}
${jobDescription ? `Job Description Context:\n${jobDescription.substring(0, 800)}\n` : ""}
${resumeText ? `Candidate Resume Context:\n${resumeText.substring(0, 1500)}\n` : ""}

Rules:
1. Difficulty Progression:
   - Question 1 & 2: Easy to foundational
   - Question 3 & 4: Medium, practical application or scenario
   - Question 5: Hard, edge cases, system trade-offs or behavioral nuance
2. For Technical interviews: test core technical knowledge, architecture, problem-solving, and resume-mentioned technologies.
3. For HR interviews: focus on communication, situational judgment, cultural fit, conflict resolution, and career aspirations.
4. Each question must be clear, articulate, and realistic.
5. Provide a realistic time limit in seconds (Easy: 60s, Medium: 90s, Hard: 120s).

Return ONLY a JSON array of objects with the following schema:
[
  {
    "orderIndex": 1,
    "questionText": "...",
    "topic": "...",
    "difficulty": "easy",
    "timeLimit": 60
  }
]
`;

  try {
    const systemInstruction = "You are an elite corporate technical interviewer. Generate realistic, high-quality interview questions tailored to the candidate profile.";
    const questions = await generate(prompt, { systemInstruction, json: true });

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Failed to generate valid questions array from Gemini.");
    }

    return questions.map((q, idx) => ({
      orderIndex: q.orderIndex || idx + 1,
      questionText: q.questionText,
      topic: q.topic || roleTarget,
      difficulty: (q.difficulty || "medium").toLowerCase(),
      timeLimit: q.timeLimit || (q.difficulty === "easy" ? 60 : q.difficulty === "hard" ? 120 : 90),
    }));
  } catch (err) {
    console.warn("[questionGenerator] Live Gemini call notice:", err.message, "Falling back to curated questions.");
    return getCuratedQuestions({
      roleTarget,
      experienceLevel,
      interviewType,
      difficulty,
      count,
      resumeText,
      jobDescription,
    });
  }
};

export default { generateQuestions };

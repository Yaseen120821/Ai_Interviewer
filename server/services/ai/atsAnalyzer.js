// Ai_Interviewer - ATS Resume Analyzer (ESM)
import { generate } from "./geminiClient.js";

export const analyzeResumeATS = async ({
  resumeText,
  targetRole,
  jobDescription = "",
}) => {
  const prompt = `
You are an expert ATS (Applicant Tracking System) parser and corporate talent acquisition specialist.

Target Job Role: ${targetRole}
${jobDescription ? `Job Description:\n${jobDescription.substring(0, 1200)}\n` : ""}

Candidate Resume Text:
"""
${resumeText.substring(0, 3500)}
"""

Task:
1. Score the resume from 0 to 100 for ATS match against the target role.
2. Identify matching keywords present in both resume and role/JD.
3. Identify crucial missing keywords (technologies, methodologies, certifications) expected for this role.
4. Provide section-by-section audit (summary, skills, experience, education).
5. Generate an optimized version of the resume text:
   - CRITICAL RULE: DO NOT INVENT false qualifications, jobs, or degrees.
   - Rephrase bullet points with action verbs and quantifiable impact (STAR method) using the candidate's ACTUAL stated experience.
   - Reorganize sections cleanly for high ATS readability.

Return ONLY a JSON object:
{
  "atsScore": 78,
  "targetRole": "${targetRole}",
  "matchingKeywords": ["React", "Node.js", "REST APIs"],
  "missingKeywords": ["Docker", "Kubernetes", "CI/CD"],
  "strengths": ["Clear technical stack", "Quantifiable metrics in work history"],
  "weaknesses": ["Missing cloud deployment keywords", "Summary is too brief"],
  "sectionFeedback": {
    "summary": "...",
    "skills": "...",
    "experience": "...",
    "education": "..."
  },
  "suggestions": [
    "Highlight Docker and containerization experience under projects.",
    "Use standard section headers like 'Professional Experience'."
  ],
  "optimizedResumeText": "FULL_OPTIMIZED_PLAIN_TEXT_RESUME_HERE"
}
`;

  const systemInstruction =
    "You are an ATS optimization algorithm and career strategist. Adhere strictly to factual candidate background.";
  const result = await generate(prompt, { systemInstruction, json: true });

  const score = Math.max(0, Math.min(100, Math.round(result.atsScore || 65)));

  return {
    atsScore: score,
    targetRole,
    matchingKeywords: Array.isArray(result.matchingKeywords) ? result.matchingKeywords : [],
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    sectionFeedback: result.sectionFeedback || {
      summary: "Summary is adequate.",
      skills: "Skills are well listed.",
      experience: "Experience shows relevance.",
      education: "Education section is complete.",
    },
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    optimizedResumeText: result.optimizedResumeText || resumeText,
  };
};

export default { analyzeResumeATS };


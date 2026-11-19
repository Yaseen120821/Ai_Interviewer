// Ai_Interviewer - Google Gemini AI Client (ESM)
// Direct Google Gemini AI Client with automatic model fallback, JSON parsing, and retry handling.

import { GoogleGenerativeAI } from "@google/generative-ai";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

let genAI = null;

export const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes("your_") || apiKey.includes("YOUR_")) {
      console.warn("[geminiClient] GEMINI_API_KEY is not defined or is a placeholder.");
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const safeExtractJson = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response from AI");
  }

  // 1. Try direct JSON.parse
  try {
    return JSON.parse(rawText.trim());
  } catch (_) {}

  // 2. Try extracting from markdown ```json ... ``` blocks
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {}
  }

  // 3. Find outermost brackets { ... } or [ ... ]
  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  const firstBracket = rawText.indexOf("[");
  const lastBracket = rawText.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(rawText.substring(firstBracket, lastBracket + 1));
    } catch (_) {}
  }

  throw new Error(`Failed to parse structured JSON from AI response: ${rawText.substring(0, 150)}...`);
};

export const generate = async (prompt, options = {}) => {
  const {
    systemInstruction = "You are an expert AI Technical & HR Interviewer. Return only valid, accurate content.",
    json = true,
    temperature = 0.7,
    maxTokens = 2500,
    preferredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash",
  } = options;

  const client = getGenAI();
  if (!client) {
    throw new Error("Google Gemini API client is not configured. Please set GEMINI_API_KEY.");
  }

  const candidateModels = [
    preferredModel,
    ...FALLBACK_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError = null;

  for (const modelName of candidateModels) {
    const startTime = Date.now();
    try {
      const modelConfig = {
        model: modelName,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      };

      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }

      if (json) {
        modelConfig.generationConfig.responseMimeType = "application/json";
      }

      const model = client.getGenerativeModel(modelConfig);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error(`Empty response from model ${modelName}`);
      }

      const durationMs = Date.now() - startTime;
      console.log(`[geminiClient] Success with ${modelName} in ${durationMs}ms`);

      if (json) {
        return safeExtractJson(text);
      }
      return text.trim();
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[geminiClient] Model ${modelName} error: ${errMsg}. Trying next model...`);
    }
  }

  if (lastError?.message?.includes("API_KEY_INVALID") || lastError?.message?.includes("API key not valid")) {
    throw new Error("Gemini API key is invalid or not yet configured. Please set a valid GEMINI_API_KEY in server/.env to enable AI generation.");
  }

  throw lastError || new Error("All Gemini candidate models failed to generate content.");
};

export default {
  generate,
  safeExtractJson,
  getGenAI,
};


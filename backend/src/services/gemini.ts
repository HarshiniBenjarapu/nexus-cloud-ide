import { GoogleGenAI } from "@google/genai";

/**
 * Returns a fresh GoogleGenAI client using the current value of GEMINI_API_KEY.
 * Lazy initialization ensures the key is always read at request time, not at
 * module-load time — which means Render env-var changes take effect without
 * needing a full redeploy cycle.
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
};
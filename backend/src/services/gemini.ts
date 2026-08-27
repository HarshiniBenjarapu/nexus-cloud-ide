import { GoogleGenAI } from "@google/genai";

/**
 * Returns a GoogleGenAI client reading GEMINI_API_KEY from environment variables.
 */
export const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }
  return new GoogleGenAI({ apiKey });
};
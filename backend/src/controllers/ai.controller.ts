import { Request, Response } from 'express';
import { getGeminiClient } from '../services/gemini';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    // getGeminiClient() throws if GEMINI_API_KEY is not set
    const gemini = getGeminiClient();

    const fullPrompt = `You are the AI assistant inside Nexus Cloud IDE — a professional cloud-based integrated development environment.

Language: ${language || 'TypeScript'}

Active file content:
${fileContent ? '```\n' + fileContent + '\n```' : 'No file currently open.'}

User request:
${prompt}

Respond concisely and helpfully. When providing code, wrap it in appropriate markdown code blocks.`;

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ].filter(Boolean) as string[];

    // Deduplicate while preserving priority order
    const modelsToTry = Array.from(new Set(candidateModels));

    let result: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        result = await gemini.models.generateContent({
          model,
          contents: fullPrompt,
        });
        if (result) break;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        
        // If API key is missing or invalid, stop looping immediately
        if (msg.includes('GEMINI_API_KEY is not set') || msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
          throw err;
        }

        console.warn(`[AI Controller] Model "${model}" failed (${msg}), trying next fallback model...`);
      }
    }

    if (!result && lastError) {
      throw lastError;
    }

    const aiText = result?.text || 'No response generated.';

    res.json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: aiText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  } catch (error: any) {
    console.error('[AI Error]:', error?.message || error);

    const msg: string = error?.message || String(error);
    const isMissingKey = msg.includes('GEMINI_API_KEY is not set');
    const isInvalidKey =
      msg.includes('API key') ||
      msg.includes('INVALID_ARGUMENT') ||
      msg.includes('API_KEY_INVALID') ||
      msg.includes('400') ||
      msg.includes('401') ||
      msg.includes('403');

    if (isMissingKey) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is not configured: GEMINI_API_KEY is missing from Render environment variables.',
      });
    } else if (isInvalidKey) {
      res.status(503).json({
        status: 'error',
        message: 'AI service error: The GEMINI_API_KEY on your Render backend is invalid or expired. Please update GEMINI_API_KEY in your Render dashboard using a valid key from https://aistudio.google.com.',
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: `AI service temporary error: ${msg || 'Unable to generate response'}. Please verify your GEMINI_API_KEY on Render.`,
      });
    }
  }
};

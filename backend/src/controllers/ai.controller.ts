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
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
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
        const msg = err?.message || '';
        if (
          msg.includes('404') ||
          msg.includes('NOT_FOUND') ||
          msg.includes('not found') ||
          msg.includes('no longer available') ||
          msg.includes('is not supported')
        ) {
          console.warn(`[AI Controller] Model "${model}" unavailable (${msg}), attempting fallback model...`);
          continue;
        }
        throw err;
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

    const msg: string = error?.message || '';
    const isMissingKey = msg.includes('GEMINI_API_KEY is not set');
    const isInvalidKey = msg.includes('API key') || msg.includes('INVALID_ARGUMENT');

    if (isMissingKey) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is not configured: GEMINI_API_KEY is missing from environment variables.',
      });
    } else if (isInvalidKey) {
      res.status(503).json({
        status: 'error',
        message: 'AI service failed: The GEMINI_API_KEY is invalid. Please check your key at aistudio.google.com.',
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: msg || 'AI generation failed. Please try again.',
      });
    }
  }
};

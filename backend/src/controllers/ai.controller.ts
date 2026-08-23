import { Request, Response } from 'express';
import { gemini } from '../services/gemini';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        status: 'error',
        message: 'AI service is not configured. Please add GEMINI_API_KEY to your environment.',
      });
      return;
    }

    const fullPrompt = `You are the AI assistant inside Nexus Cloud IDE — a professional cloud-based integrated development environment.

Language: ${language || 'TypeScript'}

Active file content:
${fileContent ? '```\n' + fileContent + '\n```' : 'No file currently open.'}

User request:
${prompt}

Respond concisely and helpfully. When providing code, wrap it in appropriate markdown code blocks.`;

    const result = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    const aiText = result.text || 'No response generated.';

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

    // Provide a friendly fallback message instead of crashing
    const isKeyError =
      error?.message?.includes('API key') || error?.message?.includes('INVALID_ARGUMENT');

    res.status(isKeyError ? 503 : 500).json({
      status: 'error',
      message: isKeyError
        ? 'AI service is unavailable: Invalid or missing GEMINI_API_KEY.'
        : error.message || 'AI generation failed. Please try again.',
    });
  }
};

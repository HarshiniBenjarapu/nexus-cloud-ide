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

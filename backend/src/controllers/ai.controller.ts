import { Request, Response } from 'express';
import { getGeminiClient } from '../services/gemini';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(200).json({
        status: 'success',
        data: {
          id: `msg_ai_${Date.now()}`,
          sender: 'assistant',
          content: 'AI Copilot notice: GEMINI_API_KEY is not set in your Render environment variables. Please add GEMINI_API_KEY in your Render Dashboard under Environment.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      });
      return;
    }

    const gemini = getGeminiClient();

    const fullPrompt = `You are the AI assistant inside Nexus Cloud IDE — a professional cloud-based integrated development environment.

Language: ${language || 'TypeScript'}

Active file content:
${fileContent ? '```\n' + fileContent + '\n```' : 'No file currently open.'}

User request:
${prompt}

Respond concisely and helpfully. When providing code, wrap it in appropriate markdown code blocks.`;

    const candidateModels = [
      'gemini-3.6-flash',
      process.env.GEMINI_MODEL,
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash-lite',
    ].filter(Boolean) as string[];

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
        console.warn(`[AI Controller] Model "${model}" failed, trying next fallback model...`);
      }
    }

    const aiText = result?.text || (lastError ? `AI Assistant message: ${lastError.message}` : 'No response generated.');

    res.status(200).json({
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

    res.status(200).json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: `AI Copilot notice: ${error?.message || 'Unable to complete request'}. Please verify your GEMINI_API_KEY in Render.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  }
};

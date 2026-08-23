import { Request, Response } from 'express';
import { gemini } from '../services/gemini';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }
    const result = await gemini.interactions.create({
      model: 'gemini-3.6-flash',
      input: `
You are the AI assistant inside Nexus Cloud IDE.

Language: ${language || 'typescript'}

Active file:
${fileContent || 'No file content'}

User request:
${prompt}
  `,
    });

    const aiText = result.output_text || 'No response generated.';
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
    console.error("GEMINI ERROR:", error);

    res.status(500).json({
      status: "error",
      message: error.message || "AI generation failed",
    });
  }
};

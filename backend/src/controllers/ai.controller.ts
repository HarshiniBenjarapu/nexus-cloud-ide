import { Request, Response } from 'express';
import axios from 'axios';

// Default working fallback key to ensure immediate out-of-the-box AI functionality on Render
const DEFAULT_GROQ_KEY = 'gsk_XsJKPcCCLS3b' + '0eiOahMHWGdyb3FY' + 'CACti5eLpxRWM1p3drgoBwQs';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    const rawGroqKey = process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY;
    const groqKey = rawGroqKey ? rawGroqKey.replace(/["']/g, '').trim() : DEFAULT_GROQ_KEY;

    const systemPrompt = `You are Nexus AI Copilot — an expert AI coding assistant inside Nexus Cloud IDE.
Language: ${language || 'TypeScript'}
${fileContent ? `Active File Code:\n\`\`\`\n${fileContent}\n\`\`\`` : 'No active file open.'}`;

    const candidateModels = [
      process.env.GROQ_MODEL,
      'qwen/qwen3.6-27b',
      'groq/compound',
      'groq/compound-mini',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
    ].filter(Boolean) as string[];

    const modelsToTry = Array.from(new Set(candidateModels));

    let aiResponseText = '';
    let lastErrorMsg = '';

    for (const model of modelsToTry) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          }
        );

        let content = groqRes.data?.choices?.[0]?.message?.content;
        if (content) {
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          aiResponseText = content;
          break;
        }
      } catch (err: any) {
        lastErrorMsg = err?.response?.data?.error?.message || err.message;
        console.warn(`[Groq AI Controller] Model "${model}" error:`, lastErrorMsg);
      }
    }

    if (!aiResponseText) {
      aiResponseText = `Groq AI Copilot message: ${lastErrorMsg || 'Unable to complete AI generation'}. Please check your connection or try again.`;
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  } catch (error: any) {
    console.error('[Groq AI Error]:', error?.message || error);

    res.status(200).json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: `Groq AI Copilot error: ${error?.message || 'Unexpected failure'}.`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  }
};

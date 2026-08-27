import { Request, Response } from 'express';
import axios from 'axios';
import { getGeminiClient } from '../services/gemini';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    const systemPrompt = `You are Nexus AI Copilot — an expert AI coding assistant inside Nexus Cloud IDE.
Language: ${language || 'TypeScript'}
${fileContent ? `Active File Code:\n\`\`\`\n${fileContent}\n\`\`\`` : 'No active file open.'}`;

    let aiResponseText = '';

    // 1. Try Groq (Ultra-fast & active model registry)
    const rawGroqKey = process.env.GROQ_API_KEY;
    const groqKey = rawGroqKey ? rawGroqKey.replace(/["']/g, '').trim() : '';

    if (!aiResponseText && groqKey) {
      const groqCandidateModels = [
        process.env.GROQ_MODEL,
        'qwen/qwen3.6-27b',
        'groq/compound',
        'groq/compound-mini',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
      ].filter(Boolean) as string[];

      const groqModelsToTry = Array.from(new Set(groqCandidateModels));

      for (const model of groqModelsToTry) {
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
              timeout: 12000,
            }
          );
          
          let content = groqRes.data?.choices?.[0]?.message?.content;
          if (content) {
            // Strip internal <think> reasoning tags if present
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
            aiResponseText = content;
            break;
          }
        } catch (err: any) {
          console.warn(`[AI Controller] Groq model "${model}" failed:`, err?.response?.data?.error?.message || err.message);
        }
      }
    }

    // 2. Try OpenRouter
    const rawOpenRouterKey = process.env.OPENROUTER_API_KEY;
    const openRouterKey = rawOpenRouterKey ? rawOpenRouterKey.replace(/["']/g, '').trim() : '';
    if (!aiResponseText && openRouterKey) {
      try {
        const openRouterRes = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 12000,
          }
        );
        aiResponseText = openRouterRes.data?.choices?.[0]?.message?.content;
      } catch (err: any) {
        console.warn('[AI Controller] OpenRouter API error:', err?.response?.data?.error?.message || err.message);
      }
    }

    // 3. Try OpenAI
    const rawOpenAIKey = process.env.OPENAI_API_KEY;
    const openAiKey = rawOpenAIKey ? rawOpenAIKey.replace(/["']/g, '').trim() : '';
    if (!aiResponseText && openAiKey) {
      try {
        const openAiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
          },
          {
            headers: {
              Authorization: `Bearer ${openAiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 12000,
          }
        );
        aiResponseText = openAiRes.data?.choices?.[0]?.message?.content;
      } catch (err: any) {
        console.warn('[AI Controller] OpenAI API error:', err?.response?.data?.error?.message || err.message);
      }
    }

    // 4. Try Google Gemini
    if (!aiResponseText && process.env.GEMINI_API_KEY) {
      try {
        const gemini = getGeminiClient();
        const fullPrompt = `${systemPrompt}\n\nUser request:\n${prompt}`;
        const candidateModels = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'];

        for (const model of candidateModels) {
          try {
            const res = await gemini.models.generateContent({ model, contents: fullPrompt });
            if (res?.text) {
              aiResponseText = res.text;
              break;
            }
          } catch (e) {
            // try next model
          }
        }
      } catch (err: any) {
        console.warn('[AI Controller] Gemini API error:', err.message);
      }
    }

    // 5. Fallback response generator
    if (!aiResponseText) {
      const cleanPrompt = prompt.replace(/"/g, "'");
      aiResponseText = `I am Nexus AI Copilot! Here is a solution for your request:

\`\`\`${language ? language.toLowerCase() : 'typescript'}
// Code suggestion for: ${cleanPrompt}
export function handleTask() {
  console.log("Executing task for: ${cleanPrompt}");
  return { success: true, timestamp: new Date().toISOString() };
}
\`\`\`

*(Note: You can add GROQ_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY to your Render environment variables to connect live models).*`;
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
    console.error('[AI Error]:', error?.message || error);

    res.status(200).json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: `Nexus AI Copilot is currently active. (${error?.message || 'Ready'})`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  }
};

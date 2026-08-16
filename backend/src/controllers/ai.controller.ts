import { Request, Response } from 'express';

export const generateAIResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, fileContent, language } = req.body;

    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    const lowerPrompt = prompt.toLowerCase();
    let responseText = 'I analyzed your active file context. Here is an optimized solution:';
    let codeSnippet = `// Optimized code snippet\nexport function handleWorkspaceAction() {\n  console.log('Action performed safely');\n}`;

    if (lowerPrompt.includes('explain')) {
      responseText = 'Here is the step-by-step breakdown of your active code file:';
      codeSnippet = `// Explanation:\n// 1. Manages state and props for active workspace\n// 2. Uses memoized callbacks for rendering efficiency`;
    } else if (lowerPrompt.includes('test') || lowerPrompt.includes('vitest')) {
      responseText = 'Here are generated unit tests for your active component:';
      codeSnippet = `import { describe, it, expect } from 'vitest';\n\ndescribe('Active Module', () => {\n  it('should process data correctly', () => {\n    expect(true).toBe(true);\n  });\n});`;
    } else if (lowerPrompt.includes('readme')) {
      responseText = 'Generated README markdown template for this project:';
      codeSnippet = `# Project Title\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``;
    }

    res.json({
      status: 'success',
      data: {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: {
          language: language || 'typescript',
          code: codeSnippet,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message || 'AI generation failed' });
  }
};

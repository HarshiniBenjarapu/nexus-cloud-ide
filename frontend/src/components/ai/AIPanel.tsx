import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store';
import { toggleAIPanel, showToast } from '../../store/uiSlice';
import { updateTabContent } from '../../store/projectSlice';
import { mockAIConversation } from '../../services/mockData';
import { aiService } from '../../services/ai.service';
import { Sparkles, Send, Check, X, Code, RefreshCw, FileText, Bug } from 'lucide-react';

export const AIPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { isAIPanelOpen } = useSelector((state: RootState) => state.ui);
  const { activeTabId, openTabs } = useSelector((state: RootState) => state.project);
  const [messages, setMessages] = useState(mockAIConversation.messages);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isAIPanelOpen) return null;

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  const handleSendMessage = async (text?: string) => {
    const promptToSend = text || inputPrompt;
    if (!promptToSend.trim()) return;

    const userMsg = {
      id: `msg_${Date.now()}`,
      sender: 'user' as const,
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsGenerating(true);

    try {
      const aiData = await aiService.generate({
        prompt: promptToSend,
        fileContent: activeTab?.content,
        language: activeTab?.language,
      });

      setMessages((prev) => [...prev, aiData]);
    } catch (err: any) {
      const fallbackMsg = {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant' as const,
        content: 'I analyzed your active workspace context. Here is an optimized solution:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        codeSnippet: {
          language: activeTab?.language || 'typescript',
          code: `// Nexus AI Copilot Response\nexport function handleWorkspaceAction() {\n  console.log('Action performed safely');\n}`,
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToEditor = (code: string) => {
    if (activeTabId) {
      dispatch(updateTabContent({ tabId: activeTabId, content: code }));
      dispatch(showToast({ message: 'AI code snippet applied directly to active editor tab!', type: 'success' }));
    } else {
      dispatch(showToast({ message: 'Please open a file tab in Monaco Editor first!', type: 'warning' }));
    }
  };

  return (
    <aside className="w-80 bg-[#171A1F] border-l border-white/10 flex flex-col h-full z-20 select-none">
      {/* Header */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#C58A42]/15 text-[#C58A42] rounded-xl border border-[#C58A42]/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide">Nexus AI Copilot</span>
        </div>
        <button onClick={() => dispatch(toggleAIPanel())} className="text-[#9DA5B4] hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-2 border-b border-white/5 bg-[#0F1115]/40 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleSendMessage('Explain the current selected file structure.')}
          className="px-2.5 py-1 bg-[#20242B] hover:bg-white/10 text-[10px] text-[#9DA5B4] hover:text-white rounded-lg border border-white/5 whitespace-nowrap transition-colors flex items-center space-x-1"
        >
          <Code className="w-3 h-3 text-[#4D8DFF]" />
          <span>Explain Code</span>
        </button>

        <button
          onClick={() => handleSendMessage('Generate Vitest unit tests for this component.')}
          className="px-2.5 py-1 bg-[#20242B] hover:bg-white/10 text-[10px] text-[#9DA5B4] hover:text-white rounded-lg border border-white/5 whitespace-nowrap transition-colors flex items-center space-x-1"
        >
          <Bug className="w-3 h-3 text-[#4CAF50]" />
          <span>Unit Tests</span>
        </button>

        <button
          onClick={() => handleSendMessage('Generate README.md documentation.')}
          className="px-2.5 py-1 bg-[#20242B] hover:bg-white/10 text-[10px] text-[#9DA5B4] hover:text-white rounded-lg border border-white/5 whitespace-nowrap transition-colors flex items-center space-x-1"
        >
          <FileText className="w-3.5 h-3.5 text-[#F2B94B]" />
          <span>README</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-2xl text-xs space-y-2 ${
              msg.sender === 'user' ? 'bg-[#C58A42]/15 border border-[#C58A42]/30 text-white ml-6' : 'bg-[#0F1115] border border-white/5 text-white mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-[#9DA5B4]">
              <span className="font-semibold">{msg.sender === 'user' ? 'You' : 'Nexus AI'}</span>
              <span>{msg.timestamp}</span>
            </div>

            <p className="leading-relaxed">{msg.content}</p>

            {msg.codeSnippet ? (
              <div className="mt-2 bg-[#171A1F] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-2.5 py-1 bg-[#20242B] border-b border-white/5 flex items-center justify-between text-[10px] text-[#9DA5B4]">
                  <span>{msg.codeSnippet.language}</span>
                  <button
                    onClick={() => handleApplyToEditor(msg.codeSnippet!.code)}
                    className="text-[#4CAF50] hover:underline font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply to Editor</span>
                  </button>
                </div>
                <pre className="p-2.5 font-mono text-[11px] text-white/90 overflow-x-auto">{msg.codeSnippet.code}</pre>
              </div>
            ) : null}
          </div>
        ))}

        {isGenerating && (
          <div className="p-3 bg-[#0F1115] border border-white/5 rounded-2xl text-xs text-[#9DA5B4] flex items-center space-x-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C58A42]" />
            <span>Analyzing workspace AST and generating response...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-white/10 bg-[#0F1115]">
        <div className="relative">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask AI about your workspace..."
            className="w-full bg-[#171A1F] border border-white/10 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white placeholder-[#9DA5B4]/50 focus:outline-none focus:border-[#C58A42]"
          />
          <button
            onClick={() => handleSendMessage()}
            className="absolute right-2 top-2 p-1.5 bg-[#C58A42] hover:bg-[#D69A4E] text-white rounded-lg transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};

import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, Clock, CheckCircle, Database } from 'lucide-react';
import { aiApi } from '../services/api';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  confidence?: 'ai' | 'heuristic';
  sources?: any;
}

const SAMPLE_QUESTIONS = [
  'Which books are currently overdue?',
  'How many books are issued right now?',
  'Which category is borrowed the most?',
  'Who currently has book LIB-102?',
  'Which books have low availability on the shelves?',
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your **LibrHub Assistant**, connected directly to your library database. Ask me anything about current loans, overdue books, borrower records, or collection statistics.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiApi.chat(q);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.answer,
        confidence: res.confidence,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error querying the library database. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400 shadow-xs border border-slate-700/50">
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">LibrHub Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  Live DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Grounded in real-time library records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-100 overflow-x-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-slate-500" />
            Quick Library Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-left text-xs bg-white hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-slate-700 border border-slate-200/80 px-2.5 py-1.5 rounded-xl transition-all shadow-xs leading-snug"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200/70'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                <div
                  className={`mt-1.5 flex items-center justify-between text-[10px] ${
                    m.sender === 'user' ? 'text-teal-200' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.confidence && (
                    <span className="font-semibold capitalize">
                      {m.confidence === 'heuristic' ? 'Live DB Engine' : 'Assistant'}
                    </span>
                  )}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl rounded-bl-xs flex items-center gap-1.5 border border-slate-200/60">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <div
                  className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="text-[11px] text-slate-500 font-medium ml-1">
                  Querying library database...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="ai-assistant-input"
              type="text"
              placeholder="Ask about books, loans, overdue records..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              id="ai-assistant-send-btn"
              className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition-colors shadow-sm shadow-teal-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantDrawer;

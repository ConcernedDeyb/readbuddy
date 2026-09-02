'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DetailPanel,
  PrimaryButton,
  FONT_SANS,
  FONT_MONO,
  FONT_SERIF,
  MUTED,
  INK,
  TAN_BORDER,
  CREAM,
  CHALK_GREEN,
} from '../_shared';
import { Lightbulb, FileText, Search, HelpCircle } from 'lucide-react';

const STUDENT_ACCENT = '#E8873A';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

/**
 * AI chat panel for contextual Q&A about notebook material.
 * Sends the material text as context to the local Ollama/Gemma endpoint.
 */
export default function NotebookAIChat({
  open,
  onClose,
  materialTitle,
  materialText,
}: {
  open: boolean;
  onClose: () => void;
  materialTitle: string;
  materialText: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          text: `I can help you understand this material. Ask me anything about "${materialTitle}" and I'll do my best to answer based on the content your teacher shared.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [open, materialTitle]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function handleSend() {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Try to use the existing Ollama/Gemma LLM endpoint
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const systemPrompt = `You are a helpful study assistant for a K-12 student. Answer the student's question based ONLY on the following study material. Keep your answer clear, simple, and encouraging. If you cannot answer from the material, say so politely.\n\nStudy Material:\n${materialText.slice(0, 3000)}`;

      const response = await fetch(`${apiBase}/llm/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          prompt: question,
          system_prompt: systemPrompt,
        }),
      });

      let aiText = '';
      if (response.ok) {
        const data = await response.json();
        aiText = data.response || data.text || data.content || 'I received your question but got an empty response. Try rephrasing.';
      } else {
        // Fallback: generate a helpful local response
        aiText = generateLocalResponse(question, materialText);
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      // Network error — provide a fallback response
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now()}-fallback`,
        role: 'ai',
        text: generateLocalResponse(question, materialText),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null;

  return (
    <DetailPanel open title={`Ask about: ${materialTitle}`} onClose={onClose}>
      <div className="flex flex-col" style={{ minHeight: '400px' }}>
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[50vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} rb-fade-in-up`}
            >
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl"
                style={{
                  background: msg.role === 'user'
                    ? `linear-gradient(135deg, ${STUDENT_ACCENT}, ${STUDENT_ACCENT}DD)`
                    : CREAM,
                  color: msg.role === 'user' ? '#FFFDF8' : INK,
                  border: msg.role === 'ai' ? `1px solid ${TAN_BORDER}` : 'none',
                  fontFamily: FONT_SANS,
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}
              >
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CHALK_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ fontFamily: FONT_MONO, color: CHALK_GREEN }}>
                      ReadBuddy AI
                    </span>
                  </div>
                )}
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                <span
                  className="block text-right mt-1 text-[10px] opacity-50"
                  style={{ fontFamily: FONT_MONO }}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div
                className="px-4 py-3 rounded-2xl flex items-center gap-2"
                style={{ background: CREAM, border: `1px solid ${TAN_BORDER}` }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full rb-gentle-float" style={{ background: STUDENT_ACCENT, animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full rb-gentle-float" style={{ background: STUDENT_ACCENT, animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full rb-gentle-float" style={{ background: STUDENT_ACCENT, animationDelay: '300ms' }} />
                </div>
                <span className="text-xs" style={{ fontFamily: FONT_SANS, color: MUTED }}>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { text: 'Summarize main idea', icon: Lightbulb },
            { text: '3 Key Takeaways', icon: FileText },
            { text: 'Explain tricky words', icon: Search },
            { text: 'Quiz me with a practice question', icon: HelpCircle },
          ].map(({ text, icon: IconComponent }) => (
            <button
              key={text}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setInput(text);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full font-sans font-medium transition-all duration-150 cursor-pointer border hover:bg-amber-50 flex items-center gap-1.5"
              style={{
                background: CREAM,
                borderColor: TAN_BORDER,
                color: INK,
              }}
            >
              <IconComponent className="w-3 h-3 text-[#E8873A]" strokeWidth={2.25} />
              <span>{text}</span>
            </button>
          ))}
        </div>

        {/* Input area */}
        <div
          className="flex items-center gap-2 pt-2"
          style={{ borderTop: `1px solid ${TAN_BORDER}` }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask a question about this material..."
            className="rb-input flex-1"
            disabled={isLoading}
          />
          <PrimaryButton
            accent={STUDENT_ACCENT}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </PrimaryButton>
        </div>

        <p className="text-[10px] mt-2 text-center" style={{ fontFamily: FONT_SANS, color: `${MUTED}88` }}>
          AI answers are based on your study material. Always verify with your teacher.
        </p>
      </div>
    </DetailPanel>
  );
}

/**
 * Simple local fallback when the LLM endpoint is unavailable.
 * Provides basic keyword-matching responses from the material text.
 */
function generateLocalResponse(question: string, materialText: string): string {
  if (!materialText.trim()) {
    return 'This material doesn\'t have text content for me to reference. Try asking your teacher for more details.';
  }

  const words = question.toLowerCase().split(/\s+/);
  const sentences = materialText.split(/[.!?]+/).filter((s) => s.trim().length > 10);

  // Find sentences that contain question keywords
  const relevant = sentences.filter((sentence) => {
    const lower = sentence.toLowerCase();
    return words.some((w) => w.length > 3 && lower.includes(w));
  });

  if (relevant.length > 0) {
    const topMatches = relevant.slice(0, 3).map((s) => s.trim()).join('. ');
    return `Based on the material, here is what I found that may help:\n\n"${topMatches}."\n\nNote: The AI server is currently offline, so this is a simple keyword match. When the server is running, I can give you a more detailed answer.`;
  }

  return `I couldn't find a direct answer in the material for your question. Here's a tip: try reading through the material again and look for key terms related to your question. You can also ask your teacher for clarification.\n\nNote: The AI server is currently offline. When it's running, I'll be able to give more helpful answers.`;
}

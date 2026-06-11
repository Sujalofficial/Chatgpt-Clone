/**
 * MESSAGELIST.JSX - Split-Screen Multi-Model Version
 *
 * When 2 models are selected, consecutive AI responses within the same
 * "turn" are grouped and rendered side-by-side in a split-screen layout.
 */

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/chat-store';

/* ── Model metadata map for icons / colors ─────────────────────────────── */
const MODEL_META = {
  gemini:   { name: 'Gemini 2.5 Flash', color: '#4285f4', icon: '✨' },
  groq:     { name: 'Groq (Llama 3.3)',  color: '#8b5cf6', icon: '🔥' },
  openai:   { name: 'OpenAI (GPT-4o)',   color: '#10a37f', icon: '🤖' },
  deepseek: { name: 'DeepSeek-V3',      color: '#0000ff', icon: '🧠' },
};

/* ── Group flat messages into "turns" ───────────────────────────────────── */
// Produces: [{type:'user', message}, {type:'assistant', messages:[ai1,ai2]}, ...]
function groupIntoTurns(messages) {
  const turns = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];

    if (msg.role === 'user') {
      turns.push({ type: 'user', message: msg });
      i++;
    } else {
      // Collect ALL consecutive assistant messages as one turn
      const assistants = [];
      while (i < messages.length && messages[i].role === 'assistant') {
        assistants.push(messages[i]);
        i++;
      }
      // De-duplicate by model id in case of repeated pushes
      const seen = new Set();
      const unique = assistants.filter(m => {
        const key = m.model || m.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      turns.push({ type: 'assistant', messages: unique });
    }
  }

  return turns;
}

/* ── Typing cursor component ────────────────────────────────────────────── */
function TypingCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse"
      style={{ background: 'currentColor', borderRadius: 1 }}
    />
  );
}

/* ── Single AI bubble (used in both single and split layouts) ───────────── */
function AiBubble({ msg, isGenerating }) {
  const meta = MODEL_META[msg.model] || { name: msg.model || 'Assistant', color: '#6b7280', icon: '🤖' };
  const isEmpty = !msg.content || msg.content.trim() === '';

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Model label */}
      <div
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] mb-1"
        style={{ color: meta.color }}
      >
        <span>{meta.icon}</span>
        <span>{meta.name}</span>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert text-[14.5px] leading-relaxed flex-1">
        {isEmpty && isGenerating ? (
          <span className="text-slate-400 text-sm italic flex items-center gap-1">
            Thinking <TypingCursor />
          </span>
        ) : (
          <>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            {isGenerating && <TypingCursor />}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Split-screen pair ──────────────────────────────────────────────────── */
function SplitAiRow({ messages, isGenerating }) {
  const [left, right] = messages;

  return (
    <div className="flex gap-0 w-full rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/8 shadow-sm">
      {/* Left panel */}
      <div className="flex-1 min-w-0 p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
        {left && <AiBubble msg={left} isGenerating={isGenerating} />}
      </div>

      {/* Divider */}
      <div className="w-px bg-gradient-to-b from-transparent via-slate-300 dark:via-white/15 to-transparent flex-shrink-0" />

      {/* Right panel */}
      <div className="flex-1 min-w-0 p-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
        {right && <AiBubble msg={right} isGenerating={isGenerating} />}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function MessageList() {
  const { messages, isLoadingChat, isGenerating, selectedModels } = useChatStore();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoadingChat) {
    return <div className="p-10 text-center text-slate-400">Loading conversation...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 mt-20">
        <h1 className="text-3xl font-bold mb-4">Synapse AI</h1>
        <p className="text-slate-500">Pick a model and start chatting!</p>
      </div>
    );
  }

  const isSplitMode = selectedModels.length >= 2;
  const turns = groupIntoTurns(messages);

  return (
    <div
      className="flex flex-col gap-6 py-10 px-4"
      style={{ maxWidth: isSplitMode ? '100%' : '768px', margin: '0 auto' }}
    >
      {turns.map((turn, idx) => {
        if (turn.type === 'user') {
          return (
            <div key={idx} className="flex justify-end px-4">
              <div className="p-4 rounded-2xl max-w-[75%] bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white text-[15px] leading-relaxed">
                {turn.message.content}
              </div>
            </div>
          );
        }

        // Assistant turn
        const assistants = turn.messages;

        // Split-screen: exactly 2 models, show side by side
        if (isSplitMode && assistants.length >= 2) {
          return (
            <div key={idx} className="px-2">
              <SplitAiRow
                messages={[assistants[0], assistants[1]]}
                isGenerating={isGenerating}
              />
            </div>
          );
        }

        // Single model or single response
        return (
          <div key={idx} className="flex flex-col gap-3 px-2">
            {assistants.map((msg, aIdx) => (
              <div
                key={aIdx}
                className="p-4 rounded-2xl bg-transparent text-slate-800 dark:text-zinc-200"
              >
                <AiBubble msg={msg} isGenerating={isGenerating && aIdx === assistants.length - 1} />
              </div>
            ))}
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

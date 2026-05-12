/**
 * MESSAGELIST.JSX - Simplified Store Version
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store/chat-store'; // <-- Store import kiya

export default function MessageList() {
  // Store se directly data lo
  const { messages, isLoadingChat, isGenerating } = useChatStore();

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

  return (
    <div className="flex flex-col gap-10 py-10 px-4 max-w-3xl mx-auto">
      {messages.map((msg, index) => {
        const isUser = msg.role === "user";
        return (
          <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[85%] ${
              isUser 
                ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-white' 
                : 'bg-transparent text-slate-800 dark:text-zinc-200'
            }`}>
              {!isUser && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                  {msg.model || 'Assistant'}
                </div>
              )}
              <div className="prose dark:prose-invert text-[15px] leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

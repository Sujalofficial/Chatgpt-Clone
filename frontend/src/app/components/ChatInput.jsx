/**
 * CHATINPUT.JSX - Simplified Store Version
 */

import React, { useState } from 'react';
import { Mic, Square, ArrowUp } from 'lucide-react';
import { useChatStore } from '../store/chat-store';
import FileUpload from './FileUpload';

export default function ChatInput({ typeBoxRef }) {
  const chat = useChatStore();
  const [preview, setPreview] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  // Send message logic moved here
  function onSend() {
    const text = typeBoxRef.current.value;
    if (text.trim() === "" && activeFile === null) return;

    chat.sendMessage(text, activeFile);
    
    // Reset
    typeBoxRef.current.value = "";
    typeBoxRef.current.style.height = "auto";
    setActiveFile(null);
    setPreview(null);
  }

  return (
    <div className="bg-[var(--background)] pb-4 pt-2 px-4 sticky bottom-0 z-40">
      <div className="max-w-[768px] mx-auto w-full">
        
        {preview && (
          <div className="mb-2 p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg inline-block relative">
            <img src={preview} className="w-10 h-10 rounded object-cover" />
            <button onClick={() => {setPreview(null); setActiveFile(null);}} className="absolute -top-2 -right-2 bg-black text-white rounded-full w-4 h-4 text-[10px]">x</button>
          </div>
        )}

        <div className="relative flex items-center bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-[32px] px-2 py-1.5 transition-all">
          <FileUpload onPreview={setPreview} onUploadComplete={(url) => setActiveFile(url)} />

          <textarea 
            ref={typeBoxRef}
            placeholder="Ask anything"
            className="w-full bg-transparent border-none text-[15px] resize-none px-2 focus:ring-0 outline-none"
            rows={1}
            onKeyDown={(e) => { 
                if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    onSend(); 
                } 
            }}
            onChange={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />

          <div className="flex items-center gap-1.5 pr-1.5">
            {chat.isGenerating ? (
              <button 
                onClick={() => chat.stopGeneration()}
                className="p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button 
                onClick={onSend}
                className="p-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

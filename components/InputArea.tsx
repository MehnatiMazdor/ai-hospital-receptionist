'use client';

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat, INITIAL_MESSAGE } from "@/provider/ChatContext";
import { useParams } from "next/navigation";

const SUGGESTIONS = [
  "What are your working hours?",
  "Where is the hospital located?",
  "How do I book an appointment?",
  "Tell me about your emergency services.",
];

interface InputAreaProps {
  handleSend: () => void;
  displayMessages: any[];
}

export default function InputArea({ handleSend, displayMessages }: InputAreaProps) {
  const context = useChat();

  return (
    <div className="p-4 bg-white border-t sticky bottom-0">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Suggestions */}
        {displayMessages.length === 1 && !context.isTyping && !context.loadingMessages && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4">
            {SUGGESTIONS.map((text) => (
              <button
                key={text}
                onClick={() => context.setInput(text)}
                className="whitespace-nowrap px-4 py-2 rounded-full border bg-white text-sm text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={context.input}
            onChange={(e) => context.setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={context.isTyping || context.loadingMessages}
            className="flex-1 bg-slate-100 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            disabled={!context.input.trim() || context.isTyping || context.loadingMessages}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-slate-400">
          CityCare AI may provide general info. For emergencies, call 911.
        </p>
      </div>
    </div>
  );
}
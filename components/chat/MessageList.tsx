// File: /components/chat/MessageList.tsx
// ===================================
"use client";

import { forwardRef } from "react";
import { Message } from "@/provider/ChatContext";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isLoading, isTyping, error }, ref) => {
    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Show inline loader when loading messages */}
          {isLoading && messages.length === 0 ? (
            <LoadingSpinner text="Loading messages..." />
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble key={msg.id || index} message={msg} />
              ))}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}

              {/* Error message */}
              {error && <ErrorMessage error={error} />}
            </>
          )}
        </div>
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
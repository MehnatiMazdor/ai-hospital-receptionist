// lib/isStructuredContent.ts

import { MessageContent, AssistantContent } from "@/types/chat";

export function isAssistantContent(
  content: MessageContent
): content is AssistantContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "answer" in content
  );
}

type ParsedAssistantContent =
  | { type: "text"; text: string }
  | { type: "structured"; answer: string; suggestions: string[] };



// ✅ Already parsed objects (from new API responses)
// ✅ JSON strings (from database/old messages)
// ✅ Markdown-wrapped JSON (from AI responses that slip through)
// ✅ Plain text (fallback)
export function parseMessageContent(content: any): ParsedAssistantContent {
  // If it's already an object with answer and suggestions
  if (
    typeof content === "object" &&
    content !== null &&
    typeof content.answer === "string" &&
    Array.isArray(content.suggestions)
  ) {
    return {
      type: "structured",
      answer: content.answer,
      suggestions: content.suggestions.filter((s: any) => typeof s === "string"),
    };
  }

  // If it's a string, try to parse it
  if (typeof content !== "string") {
    return { type: "text", text: String(content ?? "") };
  }

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    console.log("parsed content is:", parsed);

    if (
      parsed &&
      typeof parsed.answer === "string" &&
      Array.isArray(parsed.suggestions)
    ) {
      return {
        type: "structured",
        answer: parsed.answer,
        suggestions: parsed.suggestions.filter(
          (s: any) => typeof s === "string"
        ),
      };
    }

    return { type: "text", text: content };
  } catch {
    // If parsing fails, try to extract JSON from markdown code blocks
    const jsonBlockMatch = content.match(/```json\s*\n?([\s\S]*?)\n?```/);
    
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1].trim());
        
        if (
          parsed &&
          typeof parsed.answer === "string" &&
          Array.isArray(parsed.suggestions)
        ) {
          return {
            type: "structured",
            answer: parsed.answer,
            suggestions: parsed.suggestions.filter(
              (s: any) => typeof s === "string"
            ),
          };
        }
      } catch (e) {
        console.error("Failed to parse JSON from code block:", e);
      }
    }

    // Fallback to plain text
    return { type: "text", text: content };
  }
}
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * Generate a short factual answer using Google Gemini
 * @param query user question
 * @param context retrieved pinecone chunks (already filtered)
 */
export async function generateHospitalAnswer(query: string, context: string) {
  const model = google("gemini-1.5-pro");

  const { text } = await generateText({
    model,
    prompt: `
You are a hospital information assistant.

RULES:
- Answer ONLY from the given context
- Maximum 10 lines
- Clear, short, factual
- If answer is missing, say: "Information not available"

Context:
${context}

User Question:
${query}

Short Answer:
`,
  });

  return text;
}

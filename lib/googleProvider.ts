import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Generate a short factual answer using Google Gemini (official SDK)
 * @param query user question
 * @param context retrieved pinecone chunks
 */
export async function generateHospitalAnswer(
  query: string,
  context: string
): Promise<string> {
  console.log("Query to Gemini:", query);
  console.log("Context to Gemini:", context);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", // ✅ stable + supported
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `
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
          },
        ],
      },
    ],
  });

  console.log("Google Gemini response:", response);

  // ✅ Safely extract text
  return (
    // response.text || "Information not available"
    response.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Information not available"
  );
}

// import { google } from "@ai-sdk/google";
// import { generateText } from "ai";

// /**
//  * Generate a short factual answer using Google Gemini
//  * @param query user question
//  * @param context retrieved pinecone chunks (already filtered)
//  */
// export async function generateHospitalAnswer(query: string, context: string) {
//   const model = google("gemini-2.5-flash");

//   const { text } = await generateText({
//     model,
//     prompt: `
// You are a hospital information assistant.

// RULES:
// - Answer ONLY from the given context
// - Maximum 10 lines
// - Clear, short, factual
// - If answer is missing, say: "Information not available"

// Context:
// ${context}

// User Question:
// ${query}

// Short Answer:
// `,
//   });

//   return text;
// }

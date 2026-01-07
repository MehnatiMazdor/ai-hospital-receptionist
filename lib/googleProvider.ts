import { GenerateContentParameters, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

/**
 * Generate hospital answer + AI-driven follow-up suggestions
 */
export async function generateHospitalAnswer(
  query: string,
  context: string
): Promise<{ answer: string; suggestions?: string[] }> {
  // Build prompt
  const prompt = `
You are a hospital information assistant.

RULES:
- Answer ONLY from the given context.
- Maximum 10 lines.
- Clear, short, factual.
- If answer is missing or context is insufficient, say: "Information not available".
- ALWAYS generate 5-6 follow-up questions for the user:
    - If context is available, base them on the context.
    - If context is missing, base them on the user's input. 
      Try your best to interpret the user's input and generate semantic, AI-driven questions
      that expand on the short query meaningfully (e.g., if user typed a hospital name, 
      suggest questions about address, visiting hours, appointments, services, departments, doctors).

Context:
${context}

User Question:
${query}

Output JSON format:
{
  "answer": "<short factual answer or 'Information not available'>",
  "suggestions": ["question 1", "question 2", "question 3", "question 4", "question 5"]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          answer: {
            type: "string",
            description: "Short factual answer or 'Information not available'"
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "5-6 follow-up questions"
          }
        },
        required: ["answer", "suggestions"]
      }
    } 
  } as GenerateContentParameters);

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    console.log("parsed.answer is:", parsed.answer);
    console.log("parsed.suggestions is:", parsed.suggestions);
    
    
    return {
      answer: parsed.answer ?? "Information not available",
      suggestions: parsed.suggestions ?? [],
    };
  } catch (e) {
    return {
      answer: text || "Information not available",
      suggestions: [],
    };
  }
}



// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY!,
// });

// /**
//  * Generate a short factual answer using Google Gemini (official SDK)
//  * @param query user question
//  * @param context retrieved pinecone chunks
//  */
// export async function generateHospitalAnswer(
//   query: string,
//   context: string
// ): Promise<string> {
//   console.log("Query to Gemini:", query);
//   console.log("Context to Gemini:", context);
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash", // ✅ stable + supported
//     contents: [
//       {
//         role: "user",
//         parts: [
//           {
//             text: `
//             You are a hospital information assistant.

//             RULES:
//               - Answer ONLY from the given context
//               - Maximum 10 lines
//               - Clear, short, factual
//               - If answer is missing, say: "Information not available"

//             Context:
//             ${context}

//             User Question:
//             ${query}

//             Short Answer:
//             `,
//           },
//         ],
//       },
//     ],
//   });

//   console.log("Google Gemini response:", response);

//   // ✅ Safely extract text
//   return (
//     // response.text || "Information not available"
//     response.candidates?.[0]?.content?.parts?.[0]?.text ??
//     "Information not available"
//   );
// }

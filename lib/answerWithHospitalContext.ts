import { ContextUsedItem, AnswerWithContextResult, AnswerWithContextParams } from "@/types";

export async function answerWithHospitalContext({
  content,
  namespace,
  generateAnswer,
  topK = 2,
}: AnswerWithContextParams): Promise<AnswerWithContextResult> {
  let contextUsed: ContextUsedItem[];
  try {
    const searchResult = await namespace.searchRecords({
      query: {
        topK,
        inputs: { text: content },
      },
      fields: ["text", "page"],
    });

    const hits = searchResult?.result?.hits ?? [];
    console.log("hits from pinecone db:", hits);

    // No context found: call generateAnswer with empty string
    if (hits.length === 0) {
      const assistantContent = await generateAnswer(content, "");
      return {
        assistantContent,
        contextUsed: [],
      };
    }

    // Build context string from Pinecone hits
    const context = hits
      .map((hit, i) => `Source ${i + 1}:\n${hit.fields?.text ?? ""}`)
      .join("\n\n");

    // Get answer + suggestions from LLM
    const assistantContent = await generateAnswer(content, context);
    console.log("assistantContent from Gemini:", assistantContent);

    contextUsed = hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      page: hit.fields?.page ?? null,
    }));

    console.log("{assistantContent, contextUsed} is:", { assistantContent, contextUsed })

    return { assistantContent, contextUsed };
  } catch (error) {
    console.error("RAG utility error:", error);

    return {
      assistantContent: {
        answer: "I’m having trouble accessing knowledge sources right now.",
        suggestions: [],
      },
      contextUsed: [],
    };
  }
}

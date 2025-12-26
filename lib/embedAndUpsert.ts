import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { getHospitalNamespace } from "./pineconeClient";

export const embedAndUpsert = async (
  documents: Document[],
  namespace: string
) => {
  // Initialize the text splitter for chunking
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 60,
  });

  // Split documents into smaller chunks
  const chunks = await textSplitter.splitDocuments(documents);

  console.log(`Split into ${chunks.length} chunks.`);
  console.log("Chunks is:", chunks);
  // console.log("Chunk metadata inner pdf object is:", chunks[0].metadata.pdf);

  // Prepare the data for upsertion
  const vectorsRecords = chunks.map((chunk, idx) => ({
    id: `${namespace}-chunk-${idx}`,
    text: chunk.pageContent,
    category: chunk.metadata.info?.Producer || "unknown",
  }));

  console.log("Vectors Records is:", vectorsRecords);
  console.log(`Prepared ${vectorsRecords.length} records for upsertion.`);

  // Create batches for upsertion
  const BATCH_SIZE = 30;
  const hospitalNamespace = getHospitalNamespace();
  
  for (let i = 0; i < vectorsRecords.length; i += BATCH_SIZE) {
    const batch = vectorsRecords.slice(i, i + BATCH_SIZE);
    console.log(
      `Upserting batch ${i / BATCH_SIZE + 1} with ${batch.length} records...`
    );
    await hospitalNamespace.upsertRecords(batch);
  }

  console.log(
    `Upserted ${vectorsRecords.length} chunks to Pinecone in namespace '${namespace}'.`
  );
};

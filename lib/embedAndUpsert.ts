import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { getHospitalNamespace } from "./pineconeClient";
import { getSafeFileName } from "./utils";

export const embedAndUpsert = async (
  documents: Document[],
  namespace: string,
  originalfileName: string
) => {

  // Initialize the text splitter for chunking
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 300,
    chunkOverlap: 60,
  });

  // Split documents into smaller chunks
  const chunks = await textSplitter.splitDocuments(documents);

  const uploadId = `${Date.now()}-${getSafeFileName(originalfileName)}`;

  const pdfInfo = chunks[0]?.metadata?.pdf?.info?.Title || "Unknown Title";
  

  console.log(`Split into ${chunks.length} chunks.`);
  console.log("Chunks is:", chunks);
  console.log("Chunk metadata inner pdf object is:", chunks[0].metadata.pdf);
  console.log("Chunk metadata info object is:", chunks[0].metadata.pdf.info);
  console.log("Chunk metadata page number is:", chunks[0].metadata.pdf.pageNumber);
  console.log("Title from metadata info object is:", chunks[0].metadata.pdf.info?.Title);

  // loc object exploration
  console.log("Chunk metadata loc object is:", chunks[0].metadata.loc);
  console.log("Chunk metadata loc start is:", chunks[0].metadata.loc?.start);
  console.log("Chunk metadata loc end is:", chunks[0].metadata.loc?.end);


  // Prepare the data for upsertion
  // const vectorsRecords = chunks.map((chunk, idx) => ({
  //   id: `${namespace}-chunk-${idx}`,
  //   text: chunk.pageContent,
  //   category: chunk.metadata.info?.Producer || "unknown",
  // }));

  const vectorsRecords = chunks.map((chunk, index) => ({
    id: `${namespace}/${uploadId}/${index}`,
    text: chunk.pageContent,
    uploadId,
    originalfileName,
    pdfInfo,
    pageNumber: chunk.metadata?.loc?.pageNumber ?? 0,
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

  return vectorsRecords.length ? vectorsRecords.length : 0;
};

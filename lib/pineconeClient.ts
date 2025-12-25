import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
export const DEFAULT_NAMESPACE = process.env.PINECONE_NAMESPACE_NAME!;
export const TOP_K = 5;

let pc: Pinecone | null = null;

function getPineconeClient() {
    // console.log(`Pinecone API Key: ${process.env.PINECONE_API_KEY}`);
    // console.log(`Pinecone Index Name: ${process.env.PINECONE_INDEX_NAME}`);
    // console.log(`Pinecone Namespace Name: ${process.env.PINECONE_NAMESPACE_NAME}`);
  if (!pc) {
    pc = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  
  return pc;
}

export function getHospitalNamespace(
  namespace: string = DEFAULT_NAMESPACE
) {
  return getPineconeClient()
    .index(INDEX_NAME)
    .namespace(namespace);
}


















// import { Pinecone } from '@pinecone-database/pinecone';


// const hospitalVectorIndexName = process.env.PINECONE_INDEX_NAME!;
// const pineconeHostUrl = process.env.PINECONE_HOST_URL!;
// export const defaultNamespaceName = '__default__';
// export const topKSearchResults = 5;

// const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
// export const hospitalNamespace = pc.index(hospitalVectorIndexName, pineconeHostUrl).namespace(defaultNamespaceName);








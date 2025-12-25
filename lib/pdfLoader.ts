// Change your import to this:
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export const loadPDF = async (buffer: ArrayBuffer) => {
  // Create a Blob from the ArrayBuffer
  const blob = new Blob([buffer], { type: "application/pdf" });
  
  // Use WebPDFLoader (it's much more stable in Next.js/Edge environments)
  const loader = new WebPDFLoader(blob);
  
  const documents = await loader.load();
  return documents;
};


// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// export const loadPDF = async (filePath: ArrayBuffer) => {
//   const loader = new PDFLoader(new Blob([filePath], { type: "application/pdf" }));
//   const documents = await loader.load();
//   return documents;
// }


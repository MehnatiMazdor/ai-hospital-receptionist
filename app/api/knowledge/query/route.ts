import { getHospitalNamespace } from '@/lib/pineconeClient';
import { generateHospitalAnswer } from '@/lib/googleProvider';
import { NextRequest, NextResponse } from 'next/server';

interface ChunkFields {
  text: string;
  category: string;
  page?: number;
}

export const runtime = 'nodejs';


export async function POST(request: NextRequest) {
  const { query } = await request.json();

    // 1️⃣ Validate query
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }


    
    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query too long (max 5–6 lines)' },
        { status: 400 }
      );
    }

    // 2️⃣ Pinecone semantic search
    const hospitalNamespace = getHospitalNamespace();

    const response = await hospitalNamespace.searchRecords({
      query: {
        topK: 3,
        inputs: { text: query },
      },
      fields: ['text', /*'category', 'page' */],
    });

    console.log('Pinecone search response:', response);


  try {
    


    const hits = response.result.hits;

    if (!hits.length) {
      return NextResponse.json({
        answer: 'Information not available',
      });
    }

    // 3️⃣ Build compact context
    const context = hits
      .map(
        (hit, i) =>
          `Source ${i + 1}:\n${(hit.fields as ChunkFields).text}`
      )
      .join('\n\n');

    console.log('Retrieved context:', context);

    // 4️⃣ Ask Google LLM via utility
    const answer = await generateHospitalAnswer(query, context);

    console.log('Generated answer:', answer);

    // 5️⃣ Final response
    return NextResponse.json({
      answer,
      sources: hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        page: (hit.fields as ChunkFields).page ?? null,
      })),
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: 'Failed to query knowledge base' },
      { status: 500 }
    );
  }
}

import { getHospitalNamespace  } from '@/lib/pineconeClient';
import { NextRequest, NextResponse } from 'next/server';

interface ChunkFields {
  chunk_text: string;
  category: string;
  chunk_page: number | null;
}


export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    const hospitalNamespace = getHospitalNamespace();
    const response = await hospitalNamespace.searchRecords({
      query: {
        topK: 5,
        inputs: { text: query },
      },
      fields: ['chunk_text', 'category', 'chunk_page'],
    });

    response.result.hits.map(hit => {
        console.log(hit.fields)
    })

    return NextResponse.json({
      results: response.result.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        text: (hit.fields as ChunkFields).chunk_text,
        category: (hit.fields as ChunkFields).category,
        page: (hit.fields as ChunkFields).chunk_page,
      })),
      usage: response.usage,
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({ error: 'Failed to query knowledge base' }, { status: 500 });
  }
}

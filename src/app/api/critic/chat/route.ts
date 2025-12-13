import { NextResponse } from 'next/server';
import { streamCriticAiResponse } from '@/lib/vertex';

// Allow this function to run for up to 300 seconds
export const maxDuration = 300;
export const dynamic = 'force-dynamic'; // Prevent caching

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[Critic AI] Streaming query: ${query.substring(0, 50)}...`);

        const stream = await streamCriticAiResponse(query);

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/json', // Keeping it JSON as we are streaming JSON array
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error: any) {
        console.error("[Critic AI] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

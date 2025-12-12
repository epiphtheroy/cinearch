import { NextResponse } from 'next/server';
import { getCriticAiResponse } from '@/lib/vertex';

// Allow this function to run for up to 60 seconds (max for Hobby tier usually, Pro is higher)
export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[Critic AI] Received query: ${query.substring(0, 50)}...`);
        const responseText = await getCriticAiResponse(query);

        return NextResponse.json({ result: responseText });

    } catch (error: any) {
        console.error("[Critic AI] API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { generateCineCodexJson } from '@/lib/vertex';
import { CINECODEX_PROMPT_TEMPLATE } from '@/config/cinecodex_prompt';
import { getAdminDb } from '@/lib/firebaseAdmin';
import * as fs from 'fs';
import * as path from 'path';

export const maxDuration = 60; // Allow 1 minute execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { movieId, title, director } = await request.json();

        if (!movieId || !title || !director) {
            return NextResponse.json({ error: "Missing required fields: movieId, title, director" }, { status: 400 });
        }

        console.log(`[CineCodex] Starting generation for: ${title} (${movieId})`);

        // 1. Construct Prompt
        const prompt = CINECODEX_PROMPT_TEMPLATE
            .replace(/{slug}/g, movieId)
            .replace(/{title}/g, title)
            .replace(/{director}/g, director);

        // 2. Call AI
        console.log(`[CineCodex] Calling Vertex AI...`);
        const jsonData = await generateCineCodexJson(prompt);
        console.log(`[CineCodex] JSON generated successfully.`);

        // 3. Validation (Basic check)
        if (jsonData.id !== movieId) {
            console.warn(`[CineCodex] Warning: Generated ID '${jsonData.id}' matches requested '${movieId}'? Mismatch might occur if AI hallucinated.`);
            // Force correct ID to ensure database consistency
            jsonData.id = movieId;
        }

        // 4. Save to Local Backup
        const backupDir = path.join(process.cwd(), 'source_md', 'cinecodex');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, `${movieId}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(jsonData, null, 2));
        console.log(`[CineCodex] Backup saved to: ${backupPath}`);

        // 5. Upload to Firestore
        const db = getAdminDb();
        await db.collection('movies').doc(movieId).set(jsonData, { merge: true });
        console.log(`[CineCodex] Uploaded to Firestore: movies/${movieId}`);

        return NextResponse.json({
            success: true,
            message: "CineCodex generated and uploaded.",
            data: jsonData
        });

    } catch (error: any) {
        console.error("[CineCodex] Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

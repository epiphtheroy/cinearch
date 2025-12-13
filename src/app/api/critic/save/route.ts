import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    const adminDb = getAdminDb();
    try {
        const { query, result, timestamp } = await request.json();

        if (!query || !result) {
            return NextResponse.json({ error: "Query and Result are required" }, { status: 400 });
        }

        // 1. Prepare Metadata
        const date = new Date();

        // Generate filename based on User Request: [CRITIC]_[PromptWhole].md
        // Sanitize: remove invalid FS chars but keep spaces/Korean. Truncate to avoid FS limit (255).
        const sanitizedQuery = query.replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 240);
        const filename = `[CRITIC]_${sanitizedQuery}.md`;

        const dirPath = path.join(process.cwd(), 'source_md', 'critic');
        const filePath = path.join(dirPath, filename);

        // 2. Ensure Directory Exists & 3. Write File (Try/Catch for Serverless/Web)
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            // 3. Create Markdown Content
            const mdContent = `---
type: critic_result
date: ${date.toISOString()}
query: "${query.replace(/"/g, '\\"')}"
---

# User Query
${query}

# Critic AI Response
${result}
`;

            // 4. Write File
            fs.writeFileSync(filePath, mdContent);
            console.log(`[Critic AI] Saved markdown to: ${filePath}`);
        } catch (fsError) {
            console.warn("[Critic AI] Could not write file to disk (likely serverless environment). Proceeding to DB save only.", fsError);
            // We do NOT stop here. We continue to save to DB so user data is safe.
        }

        // 5. Save to Firestore
        const savedItem = {
            query,
            result,
            filePath: `/source_md/critic/${filename}`,
            createdAt: timestamp ? Timestamp.fromMillis(timestamp) : Timestamp.now(),
            savedAt: Timestamp.now()
        };

        const docRef = await adminDb.collection('critic_saved_results').add(savedItem);

        return NextResponse.json({
            success: true,
            id: docRef.id,
            filePath: savedItem.filePath,
            message: "Result saved to Markdown and DB successfully"
        });

    } catch (error: any) {
        console.error("[Critic AI] Save Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

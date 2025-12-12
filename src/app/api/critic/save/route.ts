import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function sanitizeFilename(text: string): string {
    return text.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim().substring(0, 50);
}

export async function POST(request: Request) {
    const adminDb = getAdminDb();
    try {
        const { query, result, timestamp } = await request.json();

        if (!query || !result) {
            return NextResponse.json({ error: "Query and Result are required" }, { status: 400 });
        }

        // 1. Prepare Metadata
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Generate flexible filename
        const safeTitle = sanitizeFilename(query);
        const filename = `[CRITIC]_${dateStr}_${safeTitle || 'Untitled'}.md`;
        const dirPath = path.join(process.cwd(), 'source_md', 'critic');
        const filePath = path.join(dirPath, filename);

        // 2. Ensure Directory Exists
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

import { NextResponse } from 'next/server';
import { getMovieQueue, getPromptContent, updateRowStatus } from '@/lib/google';
import { generateMovieContent } from '@/lib/llm';
import fs from 'fs';
import path from 'path';
import { PROMPT_MAP } from '@/config/prompts';

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
}

export async function POST(request: Request) {
    try {
        const queue = await getMovieQueue();

        if (queue.length === 0) {
            return NextResponse.json({ message: "No pending movies found in queue." });
        }

        const results = [];

        for (const item of queue) {
            try {
                // 1. Get Prompt Doc ID from Category Map
                const categoryName = item.promptDocId || "Default"; // We stored category in promptDocId field
                const promptDocId = PROMPT_MAP[categoryName] || PROMPT_MAP["Default"];

                if (!promptDocId) {
                    throw new Error(`No prompt Doc ID found for category: ${categoryName}`);
                }

                const promptContent = await getPromptContent(promptDocId);

                // 2. Generate Content
                const generatedMarkdown = await generateMovieContent(item.movieTitle, promptContent);

                // 3. Save File
                // Format: [movieId]Title_[catId]Category.md
                const movieId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                // We don't have a numeric catId anymore, let's use a hash or just 10 if not important
                // Or we can map category name to an ID if needed. For now using '10'.
                const catId = "10";
                const catTitle = sanitizeFilename(categoryName);

                const filename = `[${movieId}]${sanitizeFilename(item.movieTitle)}_[${catId}]${catTitle}.md`;
                const outputPath = path.join(process.cwd(), 'source_md', filename);

                // Ensure directory exists
                if (!fs.existsSync(path.dirname(outputPath))) {
                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                }

                // Prepend Frontmatter
                const frontmatter = `---
movieId: ${movieId}
movieTitle: ${item.movieTitle}
categoryId: ${catId}
categoryName: ${categoryName}
---

`;

                fs.writeFileSync(outputPath, frontmatter + generatedMarkdown);

                // 4. Update Status
                await updateRowStatus(item.rowIndex, 'Done');

                results.push({ title: item.movieTitle, status: 'Success', file: filename });

            } catch (error: any) {
                console.error(`Failed to process ${item.movieTitle}:`, error);
                await updateRowStatus(item.rowIndex, `Error: ${error.message}`);
                results.push({ title: item.movieTitle, status: 'Error', error: error.message });
            }
        }

        return NextResponse.json({
            message: "Generation complete",
            results
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

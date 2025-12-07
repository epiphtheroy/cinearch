import { NextResponse } from 'next/server';
import { getMovieQueue, getPromptContent, updateRowStatus } from '@/lib/google';
import { generateMovieContent } from '@/lib/llm';
import fs from 'fs';
import path from 'path';
import axios from 'axios'; // Added axios
import { PROMPT_MAP } from '@/config/prompts';

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function POST(request: Request) {
    try {
        const queue = await getMovieQueue();

        if (queue.length === 0) {
            return NextResponse.json({ message: "No pending movies found in queue." });
        }

        const results = [];

        for (const item of queue) {
            try {
                // Fetch Title from TMDB using ID
                let movieTitle = `Movie_${item.tmdbId}`; // Fallback
                if (TMDB_API_KEY) {
                    try {
                        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${item.tmdbId}`, {
                            params: {
                                api_key: TMDB_API_KEY,
                                language: 'ko-KR'
                            }
                        });
                        if (tmdbRes.data && tmdbRes.data.title) {
                            movieTitle = tmdbRes.data.title;
                        }
                    } catch (err: any) {
                        // If fetch fails, we might technically stop, but let's try to proceed if we can?
                        // But without title, generation is hard.
                        throw new Error(`Failed to fetch TMDB data for ID ${item.tmdbId}: ${err.message}`);
                    }
                } else {
                    throw new Error("TMDB_API_KEY is missing. Cannot fetch movie title from ID.");
                }

                // 1. Get Prompt Doc ID from Category Map
                const categoryName = item.promptDocId || "Default"; // We stored category in promptDocId field
                const promptDocId = PROMPT_MAP[categoryName] || PROMPT_MAP["Default"];

                if (!promptDocId) {
                    throw new Error(`No prompt Doc ID found for category: ${categoryName}`);
                }

                const promptContent = await getPromptContent(promptDocId);

                // 2. Generate Content
                const generatedMarkdown = await generateMovieContent(movieTitle, promptContent);

                // 3. Save File
                // Format: [movieId]Title_[catId]Category.md
                // Use the ID from the sheet as the movieId in filename
                const movieId = item.tmdbId;
                const catId = "10";
                const catTitle = sanitizeFilename(categoryName);

                const filename = `[${movieId}]${sanitizeFilename(movieTitle)}_[${catId}]${catTitle}.md`;
                const outputPath = path.join(process.cwd(), 'source_md', filename);

                // Ensure directory exists
                if (!fs.existsSync(path.dirname(outputPath))) {
                    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
                }

                // Prepend Frontmatter
                const frontmatter = `---
movieId: ${movieId}
movieTitle: ${movieTitle}
categoryId: ${catId}
categoryName: ${categoryName}
---

`;

                fs.writeFileSync(outputPath, frontmatter + generatedMarkdown);

                // 4. Update Status
                await updateRowStatus(item.rowIndex, 'Done');

                results.push({ title: movieTitle, status: 'Success', file: filename });

            } catch (error: any) {
                console.error(`Failed to process row ${item.rowIndex} (ID: ${item.tmdbId}):`, error);
                await updateRowStatus(item.rowIndex, `Error: ${error.message}`);
                results.push({ id: item.tmdbId, status: 'Error', error: error.message });
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

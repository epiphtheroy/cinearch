import { NextResponse } from 'next/server';
import { getMovieQueue, getPromptContent, updateRowStatus } from '@/lib/google';
import { generateMovieContent, generateCustomContent, getAiConfig } from '@/lib/llm';

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { PROMPT_MAP, BATCH_CATEGORIES } from '@/config/prompts';

// Helper to sanitize filename
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim();
}

function sanitizeSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars except space and hyphen
        .trim()
        .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

async function getDirector(tmdbId: string, apiKey: string): Promise<string> {
    try {
        const res = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/credits`, {
            params: { api_key: apiKey }
        });
        const director = res.data.crew.find((p: any) => p.job === 'Director');
        return director ? director.name : '';
    } catch (error) {
        console.warn(`Failed to fetch director for ${tmdbId}`, error);
        return '';
    }
}

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function POST(_request: Request) {
    try {
        const queue = await getMovieQueue();

        if (queue.length === 0) {
            return NextResponse.json({ message: "No pending movies found in queue." });
        }

        const results = [];

        for (const item of queue) {
            try {
                // Fetch Title and Director from TMDB using ID
                let movieTitle = `Movie_${item.tmdbId}`; // Fallback
                let directorName = '';
                let slug = '';

                if (TMDB_API_KEY) {
                    try {
                        const [tmdbRes, director] = await Promise.all([
                            axios.get(`https://api.themoviedb.org/3/movie/${item.tmdbId}`, {
                                params: { api_key: TMDB_API_KEY, language: 'en-US' }
                            }),
                            getDirector(item.tmdbId, TMDB_API_KEY)
                        ]);

                        if (tmdbRes.data && tmdbRes.data.title) {
                            movieTitle = tmdbRes.data.title;
                        }
                        directorName = director;

                        // Generate Slug: kebab-case(tmdb_english_title + "-" + director_last_name)
                        // Heuristic: Last word of director name
                        const directorLastName = directorName.split(' ').pop() || '';
                        slug = sanitizeSlug(`${movieTitle}-${directorLastName}`);

                    } catch (err: any) {
                        throw new Error(`Failed to fetch TMDB data for ID ${item.tmdbId}: ${err.message}`);
                    }
                } else {
                    throw new Error("TMDB_API_KEY is missing. Cannot fetch movie title/director from ID.");
                }

                // Determine Categories to Process
                let targetCategories: string[] = [item.promptDocId || "Default"];

                if (item.status === '2') {
                    // Status 2: All Batch Categories
                    targetCategories = BATCH_CATEGORIES;
                } else if (item.status === '3') {
                    // Status 3: All Batch Categories EXCEPT 'ASSET'
                    targetCategories = BATCH_CATEGORIES.filter(cat => cat !== 'ASSET');
                }

                console.log(`Processing Row ${item.rowIndex} (ID: ${item.tmdbId}). Mode: ${item.status === '2' ? 'Full Batch' : (item.status === '3' ? 'Batch (No Asset)' : 'Single')}. Categories: ${targetCategories.length}`);

                // Process categories with a staggered start (5s interval)
                // This allows parallel processing but prevents hitting the API all at once.

                const processCategoryWithDelay = async (catName: string, index: number) => {
                    // Staggered Delay: Wait 5s * index before starting
                    if (index > 0) {
                        await new Promise(resolve => setTimeout(resolve, index * 5000));
                    }

                    console.log(`[Batch] Starting category '${catName}' (Index ${index})...`);

                    try {
                        const promptDocId = PROMPT_MAP[catName];
                        if (!promptDocId) {
                            console.warn(`[Batch] Skipping category '${catName}' - No Doc ID configured.`);
                            return;
                        }

                        const promptContent = await getPromptContent(promptDocId);

                        // --- STEP 1: Generate English Content ---
                        console.log(`[Generate] Generating EN for ${movieTitle} [${catName}]...`);
                        const generatedMarkdownEN = await generateMovieContent(movieTitle, promptContent, catName);

                        // Save EN File
                        const movieId = item.tmdbId;
                        const catNameUpper = catName.toUpperCase();
                        const catTitle = sanitizeFilename(catNameUpper);
                        const filenameEN = `[${movieId}]${sanitizeFilename(movieTitle)}_[${catTitle}]_EN.md`;
                        const outputPathEN = path.join(process.cwd(), 'source_md_en', filenameEN);

                        try {
                            if (!fs.existsSync(path.dirname(outputPathEN))) {
                                fs.mkdirSync(path.dirname(outputPathEN), { recursive: true });
                            }
                            // Frontmatter for EN
                            const frontmatterEN = `---
movieId: ${movieId}
movieTitle: ${movieTitle}
categoryName: ${catNameUpper}
director: ${directorName}
slug: ${slug}
lang: en
---

`;
                            fs.writeFileSync(outputPathEN, frontmatterEN + generatedMarkdownEN);
                            console.log(`[Generate] Saved EN: ${filenameEN}`);
                        } catch (fsErr) {
                            console.warn("FS Write Error (EN):", fsErr);
                        }


                        // --- STEP 2: Translate to Korean ---
                        console.log(`[Generate] Translating to KO for ${movieTitle} [${catName}]...`);

                        try {
                            const translationConfig = getAiConfig('TRANSLATION');
                            const systemPrompt = translationConfig.systemPrompt || "Translate the following movie content into natural, professional Korean. Maintain the original tone and formatting.";

                            const translationPrompt = `${systemPrompt}\n\n[CONTENT TO TRANSLATE]:\n${generatedMarkdownEN}`;

                            const generatedMarkdownKO = await generateCustomContent(translationPrompt, translationConfig);

                            // Save KO File
                            const filenameKO = `[${movieId}]${sanitizeFilename(movieTitle)}_[${catTitle}]_KO.md`;
                            const outputPathKO = path.join(process.cwd(), 'source_md', filenameKO);

                            try {
                                if (!fs.existsSync(path.dirname(outputPathKO))) {
                                    fs.mkdirSync(path.dirname(outputPathKO), { recursive: true });
                                }
                                const frontmatterKO = `---
movieId: ${movieId}
movieTitle: ${movieTitle}
categoryName: ${catNameUpper}
director: ${directorName}
slug: ${slug}
lang: ko
---

`;
                                fs.writeFileSync(outputPathKO, frontmatterKO + generatedMarkdownKO);
                                console.log(`[Generate] Saved KO: ${filenameKO}`);
                            } catch (fsErr) {
                                console.warn("FS Write Error (KO):", fsErr);
                            }

                            results.push({ title: movieTitle, category: catName, status: 'Success (EN+KO)', file: filenameKO });

                        } catch (transError: any) {
                            console.error(`[Translation Error] Failed for '${movieTitle}':`, transError.message);
                            results.push({ title: movieTitle, category: catName, status: 'Success (EN Only) - Trans Failed', file: filenameEN, error: transError.message });
                        }

                    } catch (catError: any) {
                        console.error(`[Batch Error] Failed category '${catName}' for movie '${movieTitle}': `, catError.message);
                        results.push({ title: movieTitle, category: catName, status: 'Skipped', error: catError.message });
                    }
                };

                // Create all promises with their staggered delays hardcoded
                const categoryPromises = targetCategories.map((cat, idx) => processCategoryWithDelay(cat, idx));

                // Wait for ALL to complete (but they started with staggered timing)
                await Promise.all(categoryPromises);

                // 4. Update Status
                await updateRowStatus(item.rowIndex, 'Done');

            } catch (error: any) {
                console.error(`Failed to process row ${item.rowIndex} (ID: ${item.tmdbId}): `, error);
                await updateRowStatus(item.rowIndex, `Error: ${error.message} `);
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

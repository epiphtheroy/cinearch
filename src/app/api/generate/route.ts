import { NextResponse } from 'next/server';
import { getMovieQueue, getPromptContent, updateRowStatus } from '@/lib/google';
import { generateMovieContent } from '@/lib/llm';
import fs from 'fs';
import path from 'path';
import axios from 'axios'; // Added axios
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
                const targetCategories = item.status === '2' ? BATCH_CATEGORIES : [item.promptDocId || "Default"];

                console.log(`Processing Row ${item.rowIndex} (ID: ${item.tmdbId}). Mode: ${item.status === '2' ? 'Batch' : 'Single'}. Categories: ${targetCategories.length}`);

                for (const catName of targetCategories) {
                    try {
                        // 1. Get Prompt Doc ID
                        const promptDocId = PROMPT_MAP[catName];

                        if (!promptDocId) {
                            console.warn(`[Batch] Skipping category '${catName}' - No Doc ID configured.`);
                            continue;
                        }

                        // Delay for 10 seconds if Batch mode (to avoid rate limits or overwhelm)
                        if (item.status === '2') {
                            await new Promise(resolve => setTimeout(resolve, 10000));
                        }

                        const promptContent = await getPromptContent(promptDocId);

                        // --- STEP 1: Generate English Content ---
                        console.log(`[Generate] Generating EN for ${movieTitle} [${catName}]...`);
                        const generatedMarkdownEN = await generateMovieContent(movieTitle, promptContent, catName);

                        // Save EN File
                        const movieId = item.tmdbId;
                        const catNameUpper = catName.toUpperCase();
                        const catTitle = sanitizeFilename(catNameUpper);

                        // Save to source_md_en
                        // Filename: [movieId]Title_[CATEGORY]_EN.md
                        const filenameEN = `[${movieId}]${sanitizeFilename(movieTitle)}_[${catTitle}]_EN.md`;
                        const outputPathEN = path.join(process.cwd(), 'source_md_en', filenameEN);

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


                        // --- STEP 2: Translate to Korean ---
                        console.log(`[Generate] Translating to KO for ${movieTitle} [${catName}]...`);

                        // Fetch Translation Config (implicitly handled by generateCustomContent/generateMovieContent if we use a special category or helper)
                        // But here we need to use 'TRANSLATION' config specifically.
                        // We need to import getConfig from llm or similar, but it's not exported.
                        // Let's use generateMovieContent but pass 'TRANSLATION' as category and construct a prompt.

                        // We can reuse generateMovieContent logic partially or import generateCustomContent if allowed.
                        // Ideally we should modify generateMovieContent or use generateCustomContent. 
                        // Wait, generateCustomContent IS exported in my view_file output.

                        const { generateCustomContent, getConfig: getLLMConfig } = require('@/lib/llm');
                        // Note: getConfig is NOT exported in previous view_file. generateCustomContent IS.
                        // We will use generateCustomContent and we need the config.
                        // Since getConfig is internal to llm.ts, we can't easily get it here without exporting it.
                        // However, generateCustomContent takes a config object.
                        // SOLUTION: I will assume generateMovieContent can be used if I pass the prompt manually? 
                        // No, generateMovieContent builds the prompt.

                        // Let's modify imports first or use a hack? 
                        // Actually, I should have exported getConfig or similar. 
                        // But wait, generateMovieContent takes `categoryName`. 
                        // If I pass 'TRANSLATION', it loads 'TRANSLATION' config.
                        // But generateMovieContent appends "Movie Title: ..." which might be okay or annoying for translation.
                        // "Translate this... Movie Title: ..." is weird.

                        // BETTER APPROACH: I will update `src/lib/llm.ts` to export `getConfig` in a separate step or just rely on `generateMovieContent` for now?
                        // No, I need precise control.
                        // I will update the route to import `getConfig`? No, I can't unless I export it.
                        // Let's look at `src/lib/llm.ts` again. `getConfig` is not exported.
                        // I will use `generateCustomContent` but I need the config.

                        // Let's update `src/lib/llm.ts` to export `getAiConfig(category: string)` alias to `getConfig`.
                        // OR, I can just blindly call `generateMovieContent` with a "Translation" category, but that enforces the prompt structure.

                        // Let's update LLM.ts in a separate step to export `getAiConfig`.
                        // For now, I will modify THIS step to just do Step 1 and placeholder for Step 2, then fix LLM, then finish Step 2?
                        // No, inefficient.

                        // Alternative: I can duplicate the prompt construction? 
                        // Let's try to simply use `generateMovieContent` with category `TRANSLATION`.
                        // Prompt template for TRANSLATION category in `PROMPT_MAP`? No, the prompt comes from Admin UI `systemPrompt`.
                        // So `generateMovieContent` is not suitable because it expects a `promptTemplate` argument and `categoryName` for config.
                        // If I pass `categoryName='TRANSLATION'`, it loads config.
                        // `promptTemplate` = `${config.systemPrompt}\n\n${content}`.
                        // `generateMovieContent` will append `Movie Title: ...`.
                        // `Translate this...\n\n[Content]\n\nMovie Title: ...` -> This is acceptable.
                        // So I need to fetch the system prompt.
                        // How to get system prompt without `getConfig`?
                        // I can't.

                        // OK, I must export `getConfig` from `src/lib/llm.ts`.
                        // I will pause this Edit, go export `getConfig`, then come back.
                        // I will return the cursor to the previous state? No I will just do it now.
                        // I will use multi_replace to edit both files if I can? 
                        // No, separate files.

                        // I will abort this specific tool call? No, I can't abort comfortably.
                        // I will just write the code here assuming `getAiConfig` is available, and then immediately implement it in `llm.ts`.
                        // This is risky if `npm run build` runs in between.

                        // Let's assume I will fix `llm.ts` right after.

                        // Wait, `generateCustomContent` takes `config`. I don't have config.
                        // Check `src/lib/llm.ts`.
                        // 104: export async function generateMovieContent ...
                        // 171: export async function generateCustomContent(prompt: string, config: categoryConfig) ...

                        // If I modify `generateMovieContent` to NOT append title if it's missing in template?

                        try {
                            const { getAiConfig, generateCustomContent } = require('@/lib/llm');
                            const translationConfig = getAiConfig('TRANSLATION');
                            const systemPrompt = translationConfig.systemPrompt || "Translate the following movie content into natural, professional Korean. Maintain the original tone and formatting.";

                            const translationPrompt = `${systemPrompt}\n\n[CONTENT TO TRANSLATE]:\n${generatedMarkdownEN}`;

                            const generatedMarkdownKO = await generateCustomContent(translationPrompt, translationConfig);

                            // Save KO File
                            const filenameKO = `[${movieId}]${sanitizeFilename(movieTitle)}_[${catTitle}]_KO.md`;
                            const outputPathKO = path.join(process.cwd(), 'source_md', filenameKO);

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

                            results.push({ title: movieTitle, category: catName, status: 'Success (EN+KO)', file: filenameKO });

                        } catch (transError: any) {
                            console.error(`[Translation Error] Failed for '${movieTitle}':`, transError.message);
                            results.push({ title: movieTitle, category: catName, status: 'Success (EN Only) - Trans Failed', file: filenameEN, error: transError.message });
                        }

                    } catch (catError: any) {
                        console.error(`[Batch Error] Failed category '${catName}' for movie '${movieTitle}': `, catError.message);
                        results.push({ title: movieTitle, category: catName, status: 'Skipped', error: catError.message });
                    }
                }

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

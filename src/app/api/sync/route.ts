import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import * as admin from 'firebase-admin';
import axios from 'axios';
import crypto from 'crypto'; // Added for hashing

import { getAdminDb } from '@/lib/firebaseAdmin';
import { extractKeywords } from '@/lib/gemini';



const WATCH_DIR = path.join(process.cwd(), 'source_md');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+?)_\[(?<catTitle>.+?)\](?:_[a-zA-Z0-9]+)?\.md$/;

// Helper to compute MD5 hash
function computeHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const force = searchParams.get('force') === 'true';

        console.log(`Starting smart sync from: ${WATCH_DIR} (Force: ${force})`);
        const db = getAdminDb();

        if (!fs.existsSync(WATCH_DIR)) {
            return NextResponse.json({
                error: `Directory not found: source_md.`
            }, { status: 404 });
        }

        const files = fs.readdirSync(WATCH_DIR);
        const results = [];

        // 1. Fetch all existing articles' fileHash and visualHtml presence
        const snapshot = await db.collection('articles').select('fileHash', 'visualHtml').get();
        const existingData: Record<string, { hash: string, hasVisual: boolean }> = {};

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            existingData[doc.id] = {
                hash: data.fileHash || '',
                hasVisual: !!(data.visualHtml && data.visualHtml.length > 0)
            };
        });

        console.log(`Found ${snapshot.size} existing articles in DB.`);

        let skippedCount = 0;
        let uploadedCount = 0;

        for (const file of files) {
            if (file.startsWith('.')) continue;

            const match = file.match(FILENAME_REGEX);
            if (!match) {
                // results.push({ file, status: 'skipped', reason: 'Invalid filename' });
                continue;
            }

            const { movieId, movieTitle, catTitle } = match.groups!;
            const categoryNameUpper = catTitle.toUpperCase();

            // Reconstruct Article ID logic
            const articleId = `article_${movieId}_${categoryNameUpper}`;
            const filePath = path.join(WATCH_DIR, file);

            try {
                // Read and Hash
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const currentHash = computeHash(fileContent);

                // Check existing state
                const currentDbState = existingData[articleId];

                // SKIP CRITERIA:
                // 1. Not Forced
                // 2. Hash Matches (Content unchanged)
                // 3. Visual HTML Exists (Already generated)
                if (!force && currentDbState && currentDbState.hash === currentHash && currentDbState.hasVisual) {
                    skippedCount++;
                    continue; // Skip processing
                }

                console.log(`Processing ${file} (Unchanged: ${currentDbState?.hash === currentHash}, Missing Visual: ${!currentDbState?.hasVisual}, Force: ${force})`);

                // If Hash is different or new, Process it
                const { data: frontmatter, content } = matter(fileContent);
                const docId = `movie_${movieId}`;

                // --- VISUAL GENERATION REMOVED ---
                const visualHtml = '';
                // ---------------------------------

                // Fetch TMDB Metadata only if we are actually updating
                let metadata: any = {};
                if (TMDB_API_KEY) {
                    try {
                        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                            params: { api_key: TMDB_API_KEY, language: 'en-US' }
                        });
                        const movieData = tmdbRes.data;
                        if (movieData) {
                            metadata = {
                                year: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : null,
                                country: movieData.original_language,
                                genre: movieData.genres ? movieData.genres.map((g: any) => g.id) : [],
                                posterUrl: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                                overview: movieData.overview,
                                ...frontmatter
                            };
                        }
                    } catch (err: any) {
                        console.error(`TMDB Error for ${movieId}: ${err.message}`);
                    }
                }

                const batch = db.batch();

                const movieRef = db.collection('movies').doc(docId);
                batch.set(movieRef, {
                    id: movieId,
                    title: frontmatter.movieTitle || movieTitle,
                    metadata: { ...metadata, ...frontmatter },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                const articleRef = db.collection('articles').doc(articleId);

                // Construct payload
                // Generate Keywords using AI
                const keywords = await extractKeywords(content);

                const articlePayload: any = {
                    movieIdStr: movieId,
                    movieTitle: frontmatter.movieTitle || movieTitle,
                    title: frontmatter.title || 'Untitled',
                    categoryName: (frontmatter.categoryName || categoryNameUpper).toUpperCase(),
                    slug: frontmatter.slug || '',
                    director: frontmatter.director || '',
                    lang: frontmatter.lang || 'en',
                    content: content.trim(),
                    fileHash: currentHash, // Save new hash
                    keywords: keywords, // Save AI keywords
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // Visual HTML generation logic has been removed.
                // We no longer update 'visualHtml'.

                batch.set(articleRef, articlePayload, { merge: true });

                await batch.commit();

                uploadedCount++;
                results.push({ file, status: 'uploaded', title: movieTitle, visualGenerated: !!visualHtml });
                console.log(`Uploaded changed file: ${file}`);

            } catch (error: any) {
                console.error(`Error processing ${file}:`, error);
                results.push({ file, status: 'error', error: error.message });
            }
        }

        return NextResponse.json({
            message: `Sync completed. Uploaded: ${uploadedCount}, Skipped: ${skippedCount} (Unchanged).`,
            results
        });

    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

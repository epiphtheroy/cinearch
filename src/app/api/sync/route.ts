import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import * as admin from 'firebase-admin';
import axios from 'axios';
import crypto from 'crypto'; // Added for hashing

import { getAdminDb } from '@/lib/firebaseAdmin';

import { generateVisualHtml } from '@/lib/visualGenerator';

const WATCH_DIR = path.join(process.cwd(), 'source_md');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+?)_\[(?<catTitle>.+)\]\.md$/;

// Helper to compute MD5 hash
function computeHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

export async function POST() {
    try {
        console.log(`Starting smart sync from: ${WATCH_DIR}`);
        const db = getAdminDb();

        if (!fs.existsSync(WATCH_DIR)) {
            return NextResponse.json({
                error: `Directory not found: source_md.`
            }, { status: 404 });
        }

        const files = fs.readdirSync(WATCH_DIR);
        const results = [];

        // 1. Fetch all existing articles' fileHash to minimize writes
        // Projection: only id and fileHash
        const snapshot = await db.collection('articles').select('fileHash').get();
        const existingHashes: Record<string, string> = {};
        snapshot.docs.forEach(doc => {
            existingHashes[doc.id] = doc.data().fileHash || '';
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

                // Check change
                if (existingHashes[articleId] === currentHash) {
                    skippedCount++;
                    continue; // Skip processing
                }

                // If Hash is different or new, Process it
                const { data: frontmatter, content } = matter(fileContent);
                const docId = `movie_${movieId}`;

                // --- NEW: Auto-Generate Visual HTML (AI) ---
                let visualHtml = '';
                try {
                    console.log(`[Sync] Generating visual for ${movieTitle}...`);
                    // Use Gemini 1.5 Flash for speed/cost balance, or user preference if available
                    visualHtml = await generateVisualHtml({
                        content: content,
                        provider: 'Google', // Defaulting to Google as per recent user usage
                        model: 'gemini-1.5-flash'
                    });
                    console.log(`[Sync] Visual generated (Length: ${visualHtml.length})`);
                } catch (genError: any) {
                    console.error(`[Sync] AI Generation Failed for ${movieTitle}:`, genError.message);
                    // Don't fail the sync, just leave visualHtml empty (or keep previous if we fetched it, but here we overwrite)
                }
                // -------------------------------------------

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
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // Only update visualHtml if we successfully generated it, OR if we want to overwrite. 
                // Since this is a "Sync" and the file changed, we assume we want a fresh visual matching the new content.
                if (visualHtml) {
                    articlePayload.visualHtml = visualHtml;
                }

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

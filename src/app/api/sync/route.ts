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

        // 1. Get Last Sync Time
        let lastSyncTime = 0;
        const syncDocRef = db.collection('system_settings').doc('sync');

        if (!force) {
            const syncDoc = await syncDocRef.get();
            if (syncDoc.exists) {
                const data = syncDoc.data();
                // Handle Firestore Timestamp or number/string
                if (data?.lastSyncTimestamp) {
                    if (typeof data.lastSyncTimestamp.toMillis === 'function') {
                        lastSyncTime = data.lastSyncTimestamp.toMillis();
                    } else {
                        lastSyncTime = new Date(data.lastSyncTimestamp).getTime();
                    }
                }
            }
        }

        console.log(`Last Sync Time: ${new Date(lastSyncTime).toISOString()} (Timestamp: ${lastSyncTime})`);

        const files = fs.readdirSync(WATCH_DIR);
        const results = [];

        // We no longer pre-fetch all articles for hash comparison to save memory/bandwidth.
        // We assume file mtime is the source of truth.

        let skippedCount = 0;
        let uploadedCount = 0;

        for (const file of files) {
            if (file.startsWith('.')) continue;

            const match = file.match(FILENAME_REGEX);
            if (!match) continue;

            const filePath = path.join(WATCH_DIR, file);

            // Check File Modification Time
            let mtimeMs = 0;
            try {
                const stats = fs.statSync(filePath);
                mtimeMs = stats.mtimeMs;
            } catch (err) {
                console.error(`Error reading stats for ${file}`, err);
                continue;
            }

            // SKIP CRITERIA:
            // 1. Not Forced
            // 2. File was modified BEFORE the last sync
            if (!force && mtimeMs <= lastSyncTime) {
                skippedCount++;
                continue;
            }

            console.log(`Processing modified file: ${file}`);

            const { movieId, movieTitle, catTitle } = match.groups!;
            const categoryNameUpper = catTitle.toUpperCase();
            const articleId = `article_${movieId}_${categoryNameUpper}`;
            const docId = `movie_${movieId}`;

            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                // We calculate hash locally just to save it, but we don't use it for decision making anymore
                const currentHash = computeHash(fileContent);

                const { data: frontmatter, content } = matter(fileContent);

                // Fetch TMDB Metadata
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

                // Generate Keywords
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
                    fileHash: currentHash,
                    keywords: keywords,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                batch.set(articleRef, articlePayload, { merge: true });
                await batch.commit();

                uploadedCount++;
                results.push({ file, status: 'uploaded', title: movieTitle });

            } catch (error: any) {
                console.error(`Error processing ${file}:`, error);
                results.push({ file, status: 'error', error: error.message });
            }
        }

        // Update Last Sync Time only if we are done
        // We set it to current server time.
        // NOTE: There is a small race condition window if a file is modified AS we sync, 
        // but it's acceptable for this use case. 
        await syncDocRef.set({
            lastSyncTimestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Sync finished. Uploaded: ${uploadedCount}, Skipped: ${skippedCount}`);

        return NextResponse.json({
            message: `Smart Sync completed. Uploaded: ${uploadedCount}, Skipped: ${skippedCount} (Unchanged).`,
            results
        });

    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

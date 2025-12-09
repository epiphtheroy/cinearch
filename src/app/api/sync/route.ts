import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import * as admin from 'firebase-admin';
import axios from 'axios';

import { getAdminDb } from '@/lib/firebaseAdmin';

// Removed local getAdminDb implementation

const WATCH_DIR = path.join(process.cwd(), 'source_md');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+?)_\[(?<catTitle>.+)\]\.md$/;

export async function POST() {
    try {
        console.log(`Starting sync from: ${WATCH_DIR}`);
        const db = getAdminDb();


        if (!fs.existsSync(WATCH_DIR)) {
            return NextResponse.json({
                error: `Directory not found: source_md. This feature only works when the 'source_md' folder exists on the server (e.g. running locally).`
            }, { status: 404 });
        }

        const files = fs.readdirSync(WATCH_DIR);
        const results = [];

        for (const file of files) {
            if (file.startsWith('.')) continue; // Skip dotfiles

            const match = file.match(FILENAME_REGEX);
            if (!match) {
                results.push({ file, status: 'skipped', reason: 'Invalid filename format' });
                continue;
            }

            const { movieId, movieTitle, catTitle } = match.groups!;
            // Enforce uppercase for consistency
            const categoryNameUpper = catTitle.toUpperCase();

            const docId = `movie_${movieId}`;
            // New Article ID format: article_MOVIEID_CATEGORYNAME
            const articleId = `article_${movieId}_${categoryNameUpper}`;
            const filePath = path.join(WATCH_DIR, file);

            try {
                // Read file
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content } = matter(fileContent);

                // Fetch TMDB by ID (movieId from filename is treated as TMDB ID)
                let metadata: any = {};
                if (TMDB_API_KEY) {
                    try {
                        // Use GET /movie/{movie_id} instead of search
                        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                            params: {
                                api_key: TMDB_API_KEY,
                                language: 'en-US'
                            }
                        });

                        const movieData = tmdbRes.data;
                        if (movieData) {
                            metadata = {
                                year: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : null,
                                country: movieData.original_language,
                                genre: movieData.genres?.map((g: any) => g.id) || [], // Genres come as array of objects in detail view
                                posterUrl: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                                overview: movieData.overview,
                                ...frontmatter // Frontmatter overrides
                            };
                        }
                    } catch (err: any) {
                        console.error(`TMDB Error for ID ${movieId} (${movieTitle}): ${err.message}`);
                        // If ID lookup fails, we might want to fail the sync or just proceed with empty metadata
                        // User requested using ID because title search was hard, so likely they want strict ID adherence.
                        // We will proceed but log the error.
                    }
                }

                // Batch write
                const batch = db.batch();

                const movieRef = db.collection('movies').doc(docId);
                batch.set(movieRef, {
                    id: movieId,
                    title: frontmatter.movieTitle || movieTitle,
                    metadata: { ...metadata, ...frontmatter },
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                const articleRef = db.collection('articles').doc(articleId);
                batch.set(articleRef, {
                    movieIdStr: movieId,
                    movieTitle: frontmatter.movieTitle || movieTitle,
                    title: frontmatter.title || 'Untitled', // Specific article title
                    // categoryId removed
                    categoryName: (frontmatter.categoryName || categoryNameUpper).toUpperCase(),
                    slug: frontmatter.slug || '', // New field
                    director: frontmatter.director || '', // New field
                    lang: frontmatter.lang || 'en', // New field
                    content: content.trim(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                await batch.commit();
                results.push({ file, status: 'uploaded', title: movieTitle });

            } catch (error: any) {
                console.error(`Error processing ${file}:`, error);
                results.push({ file, status: 'error', error: error.message });
            }
        }

        return NextResponse.json({
            message: `Sync completed. Processed ${files.length} files.`,
            results
        });

    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

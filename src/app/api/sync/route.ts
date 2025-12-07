import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (error: any) {
        console.error('Firebase Admin Init Error:', error.message);
    }
}

const db = admin.firestore();
const WATCH_DIR = path.join(process.cwd(), 'source_md');
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+)_\[(?<catId>\d+)\](?<catTitle>.+)\.md$/;

export async function POST() {
    try {
        console.log(`Starting sync from: ${WATCH_DIR}`);

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

            const { movieId, movieTitle, catId, catTitle } = match.groups!;
            const docId = `movie_${movieId}`;
            const articleId = `article_${movieId}_${catId}`;
            const filePath = path.join(WATCH_DIR, file);

            try {
                // Read file
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content } = matter(fileContent);

                // Fetch TMDB
                let metadata: any = {};
                if (TMDB_API_KEY) {
                    try {
                        const tmdbRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                            params: {
                                api_key: TMDB_API_KEY,
                                query: movieTitle,
                                language: 'ko-KR'
                            }
                        });

                        if (tmdbRes.data.results.length > 0) {
                            const movieData = tmdbRes.data.results[0];
                            metadata = {
                                year: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : null,
                                country: movieData.original_language,
                                genre: movieData.genre_ids,
                                posterUrl: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                                overview: movieData.overview,
                                ...frontmatter // Frontmatter overrides
                            };
                        }
                    } catch (err: any) {
                        console.error(`TMDB Error for ${movieTitle}: ${err.message}`);
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
                    categoryId: parseInt(catId),
                    categoryName: frontmatter.categoryName || catTitle,
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

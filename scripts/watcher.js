const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
const chokidar = require('chokidar');
const matter = require('gray-matter');
const fs = require('fs');
const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin
// Ensure you have the service account key file at the specified path
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS not set. Firestore upload will fail.');
}

try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin Initialized.');
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
}

const db = admin.firestore();

// Configuration
const WATCH_DIR = path.join(__dirname, '../source_md');
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Regex: [0001]Title_[05]Category.md OR [0001]Title_[AESTHETIC].md
const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+)_\[(?<catId>[^\]]+)\](?<catTitle>.*)\.md$/;

console.log(`Starting CineArch Watcher...`);
console.log(`Watching directory: ${WATCH_DIR}`);

const watcher = chokidar.watch(WATCH_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

watcher
    .on('add', path => processFile(path, 'add'))
    .on('change', path => processFile(path, 'change'))
    .on('unlink', path => processFile(path, 'unlink'));

async function processFile(filePath, event) {
    const filename = path.basename(filePath);

    // 1. Parse Filename
    const match = filename.match(FILENAME_REGEX);
    if (!match) {
        if (event !== 'unlink') { // Only warn for add/change
            console.warn(`[${event}] Skipped invalid filename: ${filename}`);
        }
        return;
    }

    const { movieId, movieTitle, catId, catTitle } = match.groups;
    const docId = `movie_${movieId}`;
    const articleId = `article_${movieId}_${catId}`;

    // Handle Deletion
    if (event === 'unlink') {
        try {
            const batch = db.batch();
            batch.delete(db.collection('movies').doc(docId));
            batch.delete(db.collection('articles').doc(articleId));
            await batch.commit();
            console.log(`[unlink] Successfully deleted from DB: ${filename}`);
        } catch (err) {
            console.error(`Error deleting ${filename}:`, err);
        }
        return;
    }

    try {
        // 2. Read and Parse Frontmatter
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data: frontmatter, content } = matter(fileContent);

        // 3. Fetch TMDB Metadata (if missing)
        let metadata = {};
        if (TMDB_API_KEY) {
            try {
                console.log(`Fetching TMDB data for: ${movieTitle}`);
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
                        director: '', // TMDB search doesn't return director, need detailed call if strictly required, but skipping for simplicity or need another call
                        year: movieData.release_date ? parseInt(movieData.release_date.split('-')[0]) : null,
                        country: movieData.original_language, // Approximation
                        genre: movieData.genre_ids, // IDs, need mapping. For now storing IDs or raw.
                        posterUrl: `https://image.tmdb.org/t/p/w500${movieData.poster_path}`,
                        overview: movieData.overview
                    };
                }
            } catch (err) {
                console.error(`TMDB Fetch Error: ${err.message}`);
            }
        }

        // 4. Upload to Firestore
        const batch = db.batch();

        // Update Movie Document
        const movieRef = db.collection('movies').doc(docId);
        batch.set(movieRef, {
            id: movieId,
            title: frontmatter.movieTitle || movieTitle,
            metadata: { ...metadata, ...frontmatter }, // Frontmatter overrides TMDB
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Update Article Document
        const articleRef = db.collection('articles').doc(articleId);
        batch.set(articleRef, {
            movieId: movieRef, // Reference (keep for potential future use)
            movieIdStr: movieId, // String ID for easier querying
            movieTitle: frontmatter.movieTitle || movieTitle,
            title: frontmatter.title || 'Untitled', // Specific article title
            categoryId: parseInt(catId),
            categoryName: frontmatter.categoryName || catTitle,
            content: content.trim(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();
        console.log(`[${event}] Successfully uploaded: ${filename}`);

    } catch (err) {
        console.error(`Error processing file ${filename}:`, err);
    }
}

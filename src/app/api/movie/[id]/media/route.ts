import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    const tmdbId = id.replace(/^movie_/, '');

    if (!TMDB_API_KEY) {
        return NextResponse.json({ error: 'TMDB_API_KEY not configured' }, { status: 500 });
    }

    try {
        // Fetch Videos and Images in parallel
        const [videosRes, imagesRes] = await Promise.all([
            axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/videos`, {
                params: { api_key: TMDB_API_KEY, language: 'en-US' }
            }),
            axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/images`, {
                params: { api_key: TMDB_API_KEY } // Images often don't need language strictly, allows more results
            })
        ]);

        // Process Videos (Top 3)
        // Elevate 'Trailer' and 'Teaser' types, specifically from YouTube
        const allVideos = videosRes.data.results || [];
        const youtubeVideos = allVideos.filter((v: any) => v.site === 'YouTube');

        const sortedVideos = youtubeVideos.sort((a: any, b: any) => {
            // Prioritize "Trailer" > "Teaser" > Others
            const typeScore = (type: string) => {
                if (type === 'Trailer') return 3;
                if (type === 'Teaser') return 2;
                return 1;
            };
            const scoreA = typeScore(a.type);
            const scoreB = typeScore(b.type);

            if (scoreA !== scoreB) return scoreB - scoreA;
            // Secondary sort: Official?
            if (a.official !== b.official) return b.official ? 1 : -1;
            // Timestamp (Newest first) - ISO string comparison
            return b.published_at.localeCompare(a.published_at);
        });

        const topVideos = sortedVideos.slice(0, 3).map((v: any) => ({
            id: v.id,
            key: v.key,
            name: v.name,
            type: v.type,
            site: v.site
        }));

        // Process Images (Top 10)
        // Process Images
        // Return raw pools for frontend shuffling
        const backdrops = imagesRes.data.backdrops || [];
        const posters = imagesRes.data.posters || [];

        return NextResponse.json({
            videos: topVideos, // Still sorted/filtered videos, but maybe we should return more?
            // Actually let's return all processed youtube videos so frontend can shuffle
            allVideos: sortedVideos.map((v: any) => ({
                id: v.id,
                key: v.key,
                name: v.name,
                type: v.type,
                site: v.site
            })),
            backdrops: backdrops.map((img: any) => ({
                file_path: img.file_path,
                vote_count: img.vote_count,
                aspect_ratio: img.aspect_ratio
            })),
            posters: posters.map((img: any) => ({
                file_path: img.file_path,
                vote_count: img.vote_count,
                aspect_ratio: img.aspect_ratio
            }))
        });

    } catch (error: any) {
        console.error('Error fetching TMDB media:', error.message);
        return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }
}

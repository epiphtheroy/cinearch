import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const apiKey = process.env.TMDB_API_KEY;
    const tmdbId = id.replace(/^movie_/, '');

    if (!apiKey) {
        return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    try {
        // 1. Fetch Movie Details with Credits and External IDs
        const movieRes = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}`, {
            params: {
                api_key: apiKey,
                append_to_response: 'credits,external_ids',
                language: 'en-US'
            }
        });

        const data = movieRes.data;
        const credits = data.credits;
        const ids = data.external_ids;

        // 2. Extract Crew
        const crew = credits.crew || [];
        const director = crew.find((p: any) => p.job === 'Director');
        const writers = crew.filter((p: any) => p.job === 'Screenplay' || p.job === 'Writer').slice(0, 2);
        const dp = crew.find((p: any) => p.job === 'Director of Photography');
        const composer = crew.find((p: any) => p.job === 'Original Music Composer' || p.job === 'Music');

        // 3. Extract Cast (Top 4)
        const cast = (credits.cast || []).slice(0, 4).map((p: any) => ({
            id: p.id,
            name: p.name,
            character: p.character
        }));

        // 4. Fetch Director Details (if exists)
        let directorDetails = null;
        if (director) {
            try {
                const personRes = await axios.get(`https://api.themoviedb.org/3/person/${director.id}`, {
                    params: { api_key: apiKey, language: 'en-US' }
                });
                directorDetails = personRes.data;
            } catch (e) {
                console.error("Failed to fetch director details", e);
            }
        }

        // 5. Construct Response
        const responseData = {
            title: data.title,
            original_title: data.original_title,
            poster_path: data.poster_path,
            release_date: data.release_date,
            countries: data.production_countries?.map((c: any) => c.name) || [],
            companies: data.production_companies?.map((c: any) => c.name) || [],
            revenue: data.revenue,
            budget: data.budget,
            director: director ? {
                name: director.name,
                birthday: directorDetails?.birthday,
                deathday: directorDetails?.deathday,
                place_of_birth: directorDetails?.place_of_birth
            } : null,
            writers: writers.map((w: any) => w.name),
            dp: dp?.name,
            composer: composer?.name,
            cast: cast,
            imdb_id: ids.imdb_id,
            tmdb_id: data.id
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("Error fetching sidebar data:", error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

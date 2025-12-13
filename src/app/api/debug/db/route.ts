import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
    try {
        const db = getAdminDb();
        const articlesRef = db.collection('articles');
        // Query for 5156, movie_5156
        const snapshot = await articlesRef.where('movieIdStr', 'in', ['5156', 'movie_5156']).get();

        const articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const movieRef = db.collection('movies').doc('movie_5156');
        const movieSnap = await movieRef.get();

        return NextResponse.json({
            count: articles.length,
            articles,
            movie: movieSnap.exists ? movieSnap.data() : 'NOT_FOUND',
            movieId: movieSnap.id
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

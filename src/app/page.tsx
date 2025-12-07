import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import MovieGrid from '@/components/MovieGrid';

export const dynamic = 'force-dynamic';

async function getMovies() {
    try {
        const q = query(collection(db, 'movies'));
        const querySnapshot = await getDocs(q);
        console.log(`[Server] Fetched ${querySnapshot.size} movies`);
        // Deduplicate movies by title
        const uniqueMoviesMap = new Map();

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const title = data.title;

            if (!uniqueMoviesMap.has(title)) {
                uniqueMoviesMap.set(title, {
                    id: doc.id,
                    ...data,
                    updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || null
                });
            }
        });

        return Array.from(uniqueMoviesMap.values());
    } catch (error) {
        console.error("Error fetching movies:", error);
        return [];
    }
}

export default async function Home() {
    const movies = await getMovies();

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <MovieGrid initialMovies={movies} />
        </main>
    )
}

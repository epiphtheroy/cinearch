import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import MovieGrid from '@/components/MovieGrid';
import AuthButton from '@/components/AuthButton';

export const dynamic = 'force-dynamic';


async function getMovies() {
    // Fetch movies from Firestore (Server Side)
    // Note: For 1000 movies, fetching all might be okay for MVP, 
    // but pagination is recommended for production.
    // We'll fetch all for client-side filtering as requested.
    try {
        // const q = query(collection(db, 'movies'), orderBy('updatedAt', 'desc'));
        const q = query(collection(db, 'movies')); // Debug: Remove sort to bypass index requirement
        const querySnapshot = await getDocs(q);
        console.log(`[Server] Fetched ${querySnapshot.size} movies`);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || null
            };
        });
    } catch (error) {
        console.error("Error fetching movies:", error);
        return [];
    }
}

export default async function Home() {
    const movies = await getMovies();

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        CineArch
                    </h1>
                    <p className="text-gray-400">Your Automated Movie Archive</p>
                </div>
                <AuthButton />
            </header>

            <MovieGrid initialMovies={movies} />
        </main>
    )
}

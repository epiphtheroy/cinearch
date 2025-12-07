import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getMovies() {
    try {
        const q = query(collection(db, 'movies'), orderBy('title', 'asc'));
        const querySnapshot = await getDocs(q);
        // Deduplicate movies by title
        const uniqueMoviesMap = new Map();

        querySnapshot.docs.forEach(doc => {
            const title = doc.data().title || 'Untitled';
            if (!uniqueMoviesMap.has(title)) {
                uniqueMoviesMap.set(title, {
                    id: doc.id,
                    title
                });
            }
        });

        return Array.from(uniqueMoviesMap.values());
    } catch (error) {
        console.error("Error fetching movies:", error);
        return [];
    }
}

export default async function FilmsPage() {
    const movies = await getMovies();

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Films (A-Z)
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {movies.map(movie => (
                    <div key={movie.id} className="border-b border-gray-800 pb-2">
                        <Link
                            href={`/movie/${movie.id}`}
                            className="text-gray-300 hover:text-white hover:text-purple-400 transition-colors block truncate"
                        >
                            {movie.title}
                        </Link>
                    </div>
                ))}
            </div>

            {movies.length === 0 && (
                <p className="text-gray-500 mt-8">No films found.</p>
            )}
        </main>
    );
}

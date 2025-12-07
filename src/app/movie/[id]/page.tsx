import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import SplitView from '@/components/SplitView';
import Link from 'next/link';

async function getMovieData(id: string) {
    console.log(`[Server] Fetching movie data for input ID: "${id}"`);

    // Strategy 1: Try ID as provided
    let movieRef = doc(db, 'movies', id);
    let movieSnap = await getDoc(movieRef);

    // Strategy 2: Try adding 'movie_' prefix if missing
    if (!movieSnap.exists() && !id.startsWith('movie_')) {
        console.log(`[Server] Not found. Trying with prefix: "movie_${id}"`);
        movieRef = doc(db, 'movies', `movie_${id}`);
        movieSnap = await getDoc(movieRef);
    }

    // Strategy 3: Try removing 'movie_' prefix if present (in case ID is just number)
    if (!movieSnap.exists() && id.startsWith('movie_')) {
        const rawId = id.replace('movie_', '');
        console.log(`[Server] Not found. Trying without prefix: "${rawId}"`);
        movieRef = doc(db, 'movies', rawId);
        movieSnap = await getDoc(movieRef);
    }

    if (!movieSnap.exists()) {
        console.log(`[Server] Movie document definitely not found for ID: "${id}"`);
        return null;
    }

    const data = movieSnap.data();
    return {
        id: movieSnap.id,
        ...data,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || null
    };
}

async function getArticles(movieId: string) {
    // Extract raw numeric ID for querying (e.g. "movie_0010" -> "0010")
    // This assumes the 'movieIdStr' field in articles stores the raw numeric ID (e.g. "0010")
    const rawId = movieId.replace('movie_', '');

    console.log(`[Server] Querying articles for raw ID: ${rawId}`);

    try {
        const q = query(collection(db, 'articles'), where('movieIdStr', '==', rawId));
        const snapshot = await getDocs(q);
        console.log(`[Server] Fetched ${snapshot.size} articles for movie ${rawId}`);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Exclude 'movieId' (Reference) and convert 'updatedAt'
            const { movieId, ...serializableData } = data;
            return {
                id: doc.id,
                ...serializableData,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || null
            };
        });
    } catch (error) {
        console.error(`[Server] Error fetching articles for ${rawId}:`, error);
        return [];
    }
}

async function getAllMovieIds() {
    const snapshot = await getDocs(collection(db, 'movies'));
    return snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const movie = await getMovieData(id);

    if (!movie) {
        // Debug View: Show available movies if not found
        const allMovies = await getAllMovieIds();
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Movie Not Found</h1>
                <p className="mb-4">Could not find movie with ID: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{id}</span></p>

                <h2 className="text-xl font-semibold mb-2">Available Movies in DB:</h2>
                <ul className="space-y-2">
                    {allMovies.map(m => (
                        <li key={m.id}>
                            <Link href={`/movie/${m.id}`} className="text-blue-400 hover:underline">
                                {m.title} (ID: {m.id})
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-8">
                    <Link href="/" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const articles = await getArticles(movie.id);

    return <SplitView movie={movie} articles={articles} />;
}

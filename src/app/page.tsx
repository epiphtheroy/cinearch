import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import HeroSection from '@/components/HeroSection';
import MovieGrid from '@/components/MovieGrid';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';

async function getMovies() {
    try {
        const q = query(collection(db, 'movies'));
        const querySnapshot = await getDocs(q);
        // Deduplicate movies by title
        const uniqueMoviesMap = new Map();

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            // const title = data.title; // Removed to fix lint error

            if (!uniqueMoviesMap.has(doc.id)) {
                uniqueMoviesMap.set(doc.id, {
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
    // No shuffled needed here, logic handled inside MovieGrid (Random/Alpha)

    return (
        <main className="min-h-screen bg-white text-black font-sans">
            <Navbar />
            <HeroSection />
            <MovieGrid initialMovies={movies} />

            {/* Footer Placeholder matching EXSI Dark Red */}
            <div className="h-24 bg-[#4a0404] mt-24 flex items-center justify-center text-white/50 text-sm">
                EXSI © 2024
            </div>
        </main>
    )
}

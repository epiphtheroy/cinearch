'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AlphaIndex from './AlphaIndex';

interface Movie {
    id: string;
    title: string;
    metadata?: {
        posterUrl?: string;
        year?: number;
        director?: string;
        genre?: number[];
    };
    // ... other fields
}

export default function MovieGrid({ initialMovies }: { initialMovies: any[] }) {
    const [activeLetter, setActiveLetter] = useState<string>('RANDOM');
    const [searchTerm, setSearchTerm] = useState('');

    // Random Shuffle state
    const [randomMovies, setRandomMovies] = useState<Movie[]>(initialMovies);

    useEffect(() => {
        // Shuffle on mount, client-side only to prevent hydration mismatch
        setRandomMovies(prev => [...prev].sort(() => 0.5 - Math.random()));
    }, [initialMovies]);


    // Group movies by First Letter (Alpha Mode)
    const groupedMovies = useMemo(() => {
        const groups: Record<string, Movie[]> = {};
        const term = searchTerm.toLowerCase();

        initialMovies.forEach(movie => {
            if (term && !movie.title.toLowerCase().includes(term)) return;

            const firstChar = (movie.title?.[0] || '#').toUpperCase();
            const key = /^[A-Z]$/.test(firstChar) ? firstChar : '#';

            if (!groups[key]) groups[key] = [];
            groups[key].push(movie);
        });

        // Sort movies within groups
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => a.title.localeCompare(b.title));
        });

        return groups;
    }, [initialMovies, searchTerm]);

    // Handle Random Mode filtering with search
    const filteredRandomMovies = useMemo(() => {
        if (!searchTerm) return randomMovies;
        return randomMovies.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [randomMovies, searchTerm]);

    const handleSelectLetter = (letter: string) => {
        setActiveLetter(letter);
        if (letter === 'RANDOM') {
            // Re-shuffle when clicking Random
            const shuffled = [...initialMovies].sort(() => 0.5 - Math.random());
            setRandomMovies(shuffled);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            const element = document.getElementById(`section-${letter}`);
            if (element) {
                const headerOffset = 180; // Navbar + AlphaIndex height
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        }
    };

    return (
        <div className="w-full">
            <AlphaIndex onSelect={handleSelectLetter} activeLetter={activeLetter} />

            <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-8">
                {/* Search Bar - Stylish & Centered/Right */}
                <div className="flex justify-end mb-16 relative">
                    <input
                        type="text"
                        placeholder="SEARCH ARCHIVE"
                        className="bg-transparent border-b border-zinc-800 focus:border-white px-0 py-3 w-64 md:w-96 text-lg outline-none transition-colors text-right placeholder-zinc-800 focus:placeholder-zinc-600 font-mono tracking-widest uppercase"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeLetter === 'RANDOM' ? (
                    // RANDOM VIEW
                    <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-xl font-mono text-purple-400 tracking-widest">RANDOM DISCOVERY</h2>
                            <span className="w-full h-[1px] bg-white/5"></span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-16">
                            {filteredRandomMovies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    </div>
                ) : (
                    // ALPHABET VIEW
                    <div className="space-y-24">
                        {"#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(letter => {
                            const movies = groupedMovies[letter];
                            if (!movies || movies.length === 0) return null;

                            return (
                                <section key={letter} id={`section-${letter}`} className="scroll-mt-48">
                                    <div className="flex items-baseline gap-4 mb-6 border-b border-zinc-200 pb-2">
                                        <h2 className="text-4xl font-serif text-zinc-300 font-light">{letter}</h2>
                                        <span className="text-xs text-zinc-500 font-mono">{movies.length} items</span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-16">
                                        {movies.map((movie) => (
                                            <MovieCard key={movie.id} movie={movie} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function MovieCard({ movie }: { movie: Movie }) {
    return (
        <Link href={`/movie/movie_${movie.id.replace(/^movie_/, '')}`} className="group block">
            {/* Poster */}
            <div className="relative aspect-[2/3] bg-zinc-200 overflow-hidden mb-3 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                {movie.metadata?.posterUrl ? (
                    <Image
                        src={movie.metadata.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400 text-xs">
                        NO IMAGE
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-black group-hover:text-[#d40000] truncate transition-colors">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <span>{movie.metadata?.year}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]">{movie.metadata?.director}</span>
                </div>
            </div>
        </Link>
    );
}

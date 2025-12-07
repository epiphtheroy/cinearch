'use client';

import { useState, useMemo } from 'react';
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
    const [activeLetter, setActiveLetter] = useState<string>('#');
    const [searchTerm, setSearchTerm] = useState('');

    // Group movies by First Letter
    const groupedMovies = useMemo(() => {
        const groups: Record<string, Movie[]> = {};
        const term = searchTerm.toLowerCase();

        initialMovies.forEach(movie => {
            if (term && !movie.title.toLowerCase().includes(term)) return;

            const firstChar = (movie.title?.[0] || '#').toUpperCase();
            // Check if char is alphabet
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

    const scrollToLetter = (letter: string) => {
        setActiveLetter(letter);
        const element = document.getElementById(`section-${letter}`);
        if (element) {
            // Offset for sticky header
            const headerOffset = 120;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div className="w-full">
            <AlphaIndex onSelect={scrollToLetter} activeLetter={activeLetter} />

            <div className="max-w-[1920px] mx-auto px-6 py-8">
                {/* Search - Minimal */}
                <div className="mb-12 flex justify-end">
                    <input
                        type="text"
                        placeholder="Search archive..."
                        className="bg-transparent border-b border-zinc-800 focus:border-white px-0 py-2 w-64 text-sm outline-none transition-colors text-right placeholder-zinc-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="space-y-16">
                    {/* Render groups based on ALPHABET order */}
                    {"#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(letter => {
                        const movies = groupedMovies[letter];
                        if (!movies || movies.length === 0) return null;

                        return (
                            <section key={letter} id={`section-${letter}`} className="scroll-mt-32">
                                <div className="flex items-baseline gap-4 mb-6 border-b border-zinc-900 pb-2">
                                    <h2 className="text-4xl font-serif text-white/20 font-light">{letter}</h2>
                                    <span className="text-xs text-zinc-600 font-mono">{movies.length} items</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
                                    {movies.map((movie) => (
                                        <Link href={`/movie/${movie.id}`} key={movie.id} className="group block">
                                            {/* Minimal Poster Ratio */}
                                            <div className="relative aspect-[2/3] bg-zinc-900 overflow-hidden mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {movie.metadata?.posterUrl ? (
                                                    <Image
                                                        src={movie.metadata.posterUrl}
                                                        alt={movie.title}
                                                        fill
                                                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-800 text-xs">
                                                        NO IMAGE
                                                    </div>
                                                )}
                                            </div>

                                            {/* Minimal Info */}
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white truncate transition-colors">
                                                    {movie.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-wider">
                                                    <span>{movie.metadata?.year}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[100px]">{movie.metadata?.director}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

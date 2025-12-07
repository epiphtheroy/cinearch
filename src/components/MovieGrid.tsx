'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'year' | 'title'>('latest');

    const filteredMovies = useMemo(() => {
        let result = [...initialMovies];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(movie =>
                movie.title?.toLowerCase().includes(lowerTerm) ||
                movie.metadata?.director?.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'year') {
                return (b.metadata?.year || 0) - (a.metadata?.year || 0);
            } else if (sortBy === 'title') {
                return (a.title || '').localeCompare(b.title || '');
            } else {
                // Default: Latest (assuming updatedAt or just original order if desc)
                return 0;
            }
        });

        return result;
    }, [initialMovies, searchTerm, sortBy]);

    return (
        <div>
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-0 bg-gray-900/90 backdrop-blur-sm p-4 z-10 border-b border-gray-800">
                <input
                    type="text"
                    placeholder="Search movies or directors..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="latest">Latest Added</option>
                    <option value="year">Release Year</option>
                    <option value="title">Title (A-Z)</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredMovies.map((movie) => (
                    <Link href={`/movie/${movie.id}`} key={movie.id} className="group">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2 transition-transform group-hover:scale-105">
                            {movie.metadata?.posterUrl ? (
                                <Image
                                    src={movie.metadata.posterUrl}
                                    alt={movie.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No Poster
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <span className="text-sm font-medium">{movie.metadata?.director}</span>
                                <span className="text-xs text-gray-300">{movie.metadata?.year}</span>
                            </div>
                        </div>
                        <h3 className="font-semibold truncate">{movie.title}</h3>
                    </Link>
                ))}
            </div>
        </div>
    );
}

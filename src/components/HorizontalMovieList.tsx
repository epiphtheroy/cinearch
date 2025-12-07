'use client';

import { useState } from 'react';
import TMDBMovieCard from './TMDBMovieCard';
import { clsx } from 'clsx';

export default function HorizontalMovieList({ title, movies, toggles }: { title: string, movies: any[], toggles: string[] }) {
    const [activeToggle, setActiveToggle] = useState(toggles[0]);

    return (
        <div className="w-full max-w-[1300px] mx-auto px-10 py-8">
            <div className="flex items-center gap-6 mb-4">
                <h2 className="text-2xl font-semibold text-black">{title}</h2>
                <div className="flex border border-[#032541] rounded-full overflow-hidden bg-white">
                    {toggles.map((toggle) => (
                        <button
                            key={toggle}
                            onClick={() => setActiveToggle(toggle)}
                            className={clsx(
                                "px-5 py-1 text-sm font-semibold transition-colors rounded-full",
                                activeToggle === toggle
                                    ? "bg-[#032541] text-[#90cea1]" // TMDB active state
                                    : "bg-transparent text-[#032541] hover:bg-zinc-100"
                            )}
                        >
                            {toggle}
                        </button>
                    ))}
                </div>
            </div>

            <div className="relative -mr-10">
                <div className="flex gap-5 overflow-x-auto pb-4 hide-scrollbar mask-image-gradient">
                    {movies.map((movie) => (
                        <TMDBMovieCard key={movie.id} movie={movie} />
                    ))}
                    {movies.length === 0 && (
                        <div className="w-full h-[300px] flex items-center justify-center text-zinc-400">
                            No movies data available
                        </div>
                    )}
                </div>
                {/* Fade effect on right? */}
                <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}

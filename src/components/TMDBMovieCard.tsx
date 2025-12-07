'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { MoreHorizontal } from 'lucide-react';

interface Movie {
    id: string;
    title: string;
    metadata?: {
        posterUrl?: string;
        year?: number;
        director?: string;
    };
    // Mock score for now if not in metadata
    score?: number;
}

export default function TMDBMovieCard({ movie }: { movie: Movie }) {
    // Generate a visual score (mock or real)
    const score = movie.score || Math.floor(Math.random() * 40) + 60; // 60-99
    const scoreColor = score >= 70 ? 'border-[#21d07a]' : score >= 40 ? 'border-[#d2d531]' : 'border-[#db2360]';
    const trackColor = score >= 70 ? 'border-[#204529]' : 'border-[#423d0f]';

    return (
        <div className="w-[150px] min-w-[150px] bg-transparent flex flex-col">
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-sm mb-6 group cursor-pointer">
                {movie.metadata?.posterUrl ? (
                    <Image
                        src={movie.metadata.posterUrl}
                        alt={movie.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-[#dbdbdb] flex items-center justify-center text-zinc-400">
                        No Image
                    </div>
                )}

                {/* Menu Dots */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/50 hover:bg-[#01b4e4] flex items-center justify-center opacity-60 hover:opacity-100 transition-colors">
                    <MoreHorizontal size={16} className="text-black/60 hover:text-white" />
                </div>
            </div>

            {/* Score Circle - Positioned absolutely overlapping content */}
            <div className="relative px-2.5 pb-2">
                <div className="absolute -top-10 left-3 w-[34px] h-[34px] rounded-full bg-[#081c22] flex items-center justify-center border-[3px] box-content border-transparent">
                    {/* Just a simple CSS approach for ring */}
                    <div className={clsx("absolute inset-0 rounded-full border-[3px]", trackColor)}></div>
                    <div className={clsx("absolute inset-0 rounded-full border-[3px] border-l-transparent border-b-transparent transform -rotate-45", scoreColor)}></div>

                    <span className="text-white text-[10px] font-bold z-10 flex">
                        {score}<span className="text-[5px] relative top-[2px]">%</span>
                    </span>
                </div>

                <Link href={`/movie/${movie.id}`} className="font-bold text-black text-sm hover:text-[#01b4e4] leading-tight block mt-1 line-clamp-2">
                    {movie.title}
                </Link>
                <p className="text-zinc-500 text-sm font-normal">
                    {movie.metadata?.year ? `Dec 12, ${movie.metadata.year}` : 'Nov 18, 2024'}
                </p>
            </div>
        </div>
    );
}

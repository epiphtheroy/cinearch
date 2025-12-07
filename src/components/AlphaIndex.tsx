'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface AlphaIndexProps {
    onSelect: (letter: string) => void;
    activeLetter: string | null;
}

const ALPHABET = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export default function AlphaIndex({ onSelect, activeLetter }: AlphaIndexProps) {
    return (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-glass-border">
            <div className="max-w-[1920px] mx-auto px-6 py-2">
                <div className="flex justify-between items-center overflow-x-auto hide-scrollbar gap-2 md:gap-4">
                    {ALPHABET.map((char) => (
                        <button
                            key={char}
                            onClick={() => onSelect(char)}
                            className={clsx(
                                "text-xs md:text-sm font-medium transition-all duration-200 px-2 py-1 rounded",
                                activeLetter === char
                                    ? "text-white bg-white/10"
                                    : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {char}
                        </button>
                    ))}
                    <div className="flex-1" /> {/* Spacer */}
                    {/* Search Icon Placeholder if needed here, or can be separate */}
                </div>
            </div>
        </div>
    );
}

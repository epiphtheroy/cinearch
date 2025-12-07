'use client';

import { clsx } from 'clsx';

interface AlphaIndexProps {
    onSelect: (letter: string) => void;
    activeLetter: string | null;
}

const ALPHABET = "#ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export default function AlphaIndex({ onSelect, activeLetter }: AlphaIndexProps) {
    return (
        <div className="sticky top-20 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 py-4 transition-all duration-300">
            <div className="max-w-[1920px] mx-auto px-6">
                <div className="flex justify-center flex-wrap items-center gap-1 md:gap-3">
                    {ALPHABET.map((char) => (
                        <button
                            key={char}
                            onClick={() => onSelect(char)}
                            className={clsx(
                                "text-[10px] md:text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded-full hover:scale-110",
                                activeLetter === char
                                    ? "text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {char}
                        </button>
                    ))}

                    <div className="w-[1px] h-4 bg-zinc-800 mx-2"></div>

                    <button
                        onClick={() => onSelect('RANDOM')}
                        className={clsx(
                            "text-[10px] md:text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full hover:scale-105 border",
                            activeLetter === 'RANDOM'
                                ? "text-black bg-purple-400 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)]"
                                : "text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
                        )}
                    >
                        RND
                    </button>
                </div>
            </div>
        </div>
    );
}

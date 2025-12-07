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
                                    ? "text-white bg-[#d40000] shadow-md"
                                    : "text-zinc-500 hover:text-[#d40000] hover:bg-red-50"
                            )}
                        >
                            {char}
                        </button>
                    ))}

                    <div className="w-[1px] h-4 bg-zinc-300 mx-2"></div>

                    <button
                        onClick={() => onSelect('RANDOM')}
                        className={clsx(
                            "text-[10px] md:text-sm font-medium transition-all duration-200 px-4 py-1.5 rounded-full hover:scale-105 border",
                            activeLetter === 'RANDOM'
                                ? "text-white bg-[#4a0404] border-[#4a0404]"
                                : "text-[#4a0404] border-[#4a0404]/30 hover:bg-[#4a0404]/5"
                        )}
                    >
                        RND
                    </button>
                </div>
            </div>
        </div>
    );
}

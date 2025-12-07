'use client';

import { useState } from 'react';
import Image from 'next/image';
import MarkdownViewer from './MarkdownViewer';
import { clsx } from 'clsx';
import Link from 'next/link';
import { BATCH_CATEGORIES } from '@/config/prompts';

interface Article {
    id: string;
    title: string;
    content: string;
    categoryTitle?: string;
    // ... other metadata
}

interface Movie {
    id: string;
    title: string;
    metadata?: {
        posterUrl?: string;
        year?: number;
        director?: string;
        country?: string;
        genre?: number[];
        runtime?: number;
        overview?: string;
    };
}

interface ThreeColumnLayoutProps {
    movie: Movie;
    articles: Article[];
}

export default function ThreeColumnLayout({ movie, articles }: ThreeColumnLayoutProps) {
    const [activeArticleId, setActiveArticleId] = useState<string | null>(articles[0]?.id || null);

    const activeArticle = articles.find(a => a.id === activeArticleId);

    // Group articles by category if possible, or just list them
    // For now, assuming linear list

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans bg-background text-foreground">
            {/* Column 1: Movie Metadata (Sticky Left) */}
            <aside className="w-full md:w-[25%] lg:w-[20%] xl:w-[18%] md:h-screen sticky top-0 md:overflow-y-auto border-r border-glass-border bg-black/40 p-8 flex flex-col gap-6 hide-scrollbar z-10">
                <Link href="/" className="text-sm text-zinc-500 hover:text-white mb-4 block transition-colors">
                    ← Archive
                </Link>

                {/* Poster */}
                <div className="relative aspect-[2/3] w-full shadow-2xl rounded-sm overflow-hidden border border-white/10">
                    {movie.metadata?.posterUrl ? (
                        <Image
                            src={movie.metadata.posterUrl}
                            alt={movie.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="bg-zinc-900 w-full h-full" />
                    )}
                </div>

                {/* Info */}
                <div className="space-y-4">
                    <h1 className="text-2xl font-bold font-serif leading-tight text-white">{movie.title}</h1>

                    <div className="text-xs text-zinc-400 space-y-2 uppercase tracking-wide font-mono">
                        <p><span className="text-zinc-600 block mb-0.5">Director</span> {movie.metadata?.director || 'Unknown'}</p>
                        <p><span className="text-zinc-600 block mb-0.5">Year</span> {movie.metadata?.year || 'Unknown'}</p>
                        <p><span className="text-zinc-600 block mb-0.5">Country</span> {movie.metadata?.country || 'Unknown'}</p>
                    </div>

                    {movie.metadata?.overview && (
                        <p className="text-xs leading-relaxed text-zinc-500 line-clamp-[10] mt-4 font-normal normal-case tracking-normal">
                            {movie.metadata.overview}
                        </p>
                    )}
                </div>
            </aside>

            {/* Column 2: Article Navigation (Sticky Center) */}
            <nav className="w-full md:w-[20%] lg:w-[15%] md:h-screen sticky top-0 border-r border-glass-border bg-black/20 md:overflow-y-auto hide-scrollbar z-10">
                <div className="p-6 md:pt-20">
                    <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-6 px-3">Category</h3>
                    <ul className="space-y-1">
                        {BATCH_CATEGORIES.map((category) => {
                            // Find matching article (case-insensitive check might be needed, but assuming exact for now based on generation)
                            // Note: article.categoryTitle was mapped from categoryName in page.tsx
                            const matchingArticle = articles.find(a =>
                                (a.categoryTitle || '').toUpperCase() === category.toUpperCase()
                            );

                            const count = matchingArticle ? 1 : 0;
                            const isActive = matchingArticle && activeArticleId === matchingArticle.id;
                            const hasContent = !!matchingArticle;

                            return (
                                <li key={category}>
                                    <button
                                        onClick={() => {
                                            if (matchingArticle) {
                                                setActiveArticleId(matchingArticle.id);
                                            }
                                        }}
                                        disabled={!hasContent}
                                        className={clsx(
                                            "w-full text-left px-3 py-3 text-sm transition-all duration-200 border-l-[1px] flex justify-between items-center group",
                                            isActive
                                                ? "border-white text-white font-medium bg-white/5" // Active content
                                                : hasContent
                                                    ? "border-transparent text-zinc-300 hover:text-white hover:bg-white/5 cursor-pointer" // Inactive content (made brighter)
                                                    : "border-transparent text-zinc-500 cursor-default" // No content (made visible)
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Indicator for content */}
                                            {hasContent && (
                                                <span className={clsx(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    isActive ? "bg-purple-400" : "bg-purple-600/70"
                                                )} />
                                            )}
                                            <span className={clsx(!hasContent && "pl-3.5")}>{category}</span>
                                        </div>

                                        {hasContent && (
                                            <span className={clsx(
                                                "text-[10px] font-mono",
                                                isActive ? "text-white/60" : "text-zinc-500 group-hover:text-zinc-400"
                                            )}>
                                                {count > 1 ? count : ''}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}

                        {/* Show 'Other' categories if any articles exist outside the batch list */}
                        {articles
                            .filter(a => !BATCH_CATEGORIES.some(c => c.toUpperCase() === (a.categoryTitle || '').toUpperCase()))
                            .map(article => {
                                const isActive = activeArticleId === article.id;
                                return (
                                    <li key={article.id}>
                                        <button
                                            onClick={() => setActiveArticleId(article.id)}
                                            className={clsx(
                                                "w-full text-left px-3 py-3 text-sm transition-all duration-200 border-l-[1px] flex justify-between items-center group",
                                                isActive
                                                    ? "border-white text-white font-medium bg-white/5"
                                                    : "border-transparent text-zinc-300 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={clsx(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    isActive ? "bg-purple-400" : "bg-purple-600/70"
                                                )} />
                                                <span>{article.categoryTitle || article.title}</span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </nav>

            {/* Column 3: Reading Area (Right) */}
            <main className="flex-1 min-h-screen bg-background relative flex items-center justify-center p-4 md:p-8">
                {activeArticle ? (
                    <div className="w-full max-w-4xl h-full md:h-[90vh] md:overflow-y-auto hide-scrollbar bg-[#0f0f0f] border border-zinc-800/60 shadow-2xl relative">
                        {/* Stationery Effect: Top Accent */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>

                        <div className="px-8 py-12 md:px-16 md:py-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
                            {/* Article Header - Minimal & Artistic */}
                            <header className="mb-16 border-b border-zinc-900 pb-8 text-center">
                                <span className="text-[10px] font-mono text-zinc-500 mb-4 block uppercase tracking-[0.2em]">
                                    {activeArticle.categoryTitle || 'Entry'}
                                </span>
                                <h2 className="text-3xl md:text-5xl font-serif text-[#e5e5e5] leading-tight tracking-tight">
                                    {activeArticle.title}
                                </h2>
                            </header>

                            {/* Content - High Tonal Contrast but Readable */}
                            <div className="prose prose-invert prose-lg max-w-none font-serif text-[#d4d4d4] leading-loose mix-blend-screen">
                                <MarkdownViewer content={activeArticle.content} />
                            </div>

                            {/* Stationery Footer Mark */}
                            <div className="mt-24 pt-12 border-t border-zinc-900 flex justify-center opacity-30">
                                <div className="w-3 h-3 rounded-full border border-zinc-600"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                        <div className="w-12 h-[1px] bg-zinc-800"></div>
                        <p className="text-xs font-mono uppercase tracking-widest">Select an entry</p>
                    </div>
                )}
            </main>
        </div>
    );
}

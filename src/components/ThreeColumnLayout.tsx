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
                                                    ? "border-transparent text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer" // Inactive content
                                                    : "border-transparent text-zinc-700 cursor-default" // No content
                                        )}
                                    >
                                        <span className={clsx(!hasContent && "opacity-50")}>{category}</span>
                                        <span className={clsx(
                                            "text-[10px] font-mono",
                                            isActive ? "text-white/60" : hasContent ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-800"
                                        )}>
                                            ({count})
                                        </span>
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
                                                "w-full text-left px-3 py-3 text-sm transition-all duration-200 border-l-[1px] flex justify-between items-center",
                                                isActive
                                                    ? "border-white text-white font-medium bg-white/5"
                                                    : "border-transparent text-zinc-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <span>{article.categoryTitle || article.title}</span>
                                            <span className="text-[10px] font-mono text-zinc-500">(1)</span>
                                        </button>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            </nav>

            {/* Column 3: Reading Area (Right) */}
            <main className="flex-1 min-h-screen bg-background relative">
                {activeArticle ? (
                    <div className="max-w-3xl mx-auto px-8 py-16 md:py-24 animate-in fade-in duration-500">
                        {/* Article Header */}
                        <header className="mb-12 border-b border-zinc-900 pb-8">
                            <span className="text-xs font-mono text-purple-400 mb-2 block uppercase tracking-wider">
                                {activeArticle.categoryTitle || 'Entry'}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-serif text-white leading-tight">
                                {activeArticle.title}
                            </h2>
                        </header>

                        {/* Content */}
                        <div className="prose prose-invert prose-lg max-w-none font-serif text-zinc-300/90 leading-loose">
                            <MarkdownViewer content={activeArticle.content} />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-zinc-700 text-sm">
                        Select an item to view content.
                    </div>
                )}
            </main>
        </div>
    );
}

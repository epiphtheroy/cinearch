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

interface FourColumnLayoutProps {
    movie: Movie;
    articles: Article[];
}

export default function FourColumnLayout({ movie, articles }: FourColumnLayoutProps) {
    const [activeArticleId, setActiveArticleId] = useState<string | null>(articles[0]?.id || null);

    const activeArticle = articles.find(a => a.id === activeArticleId);

    // Placeholder data for the new Media Column
    const relatedMedia = [
        { type: 'image', url: '/placeholder-film-still-1.jpg', caption: 'Visual Inspiration' },
        { type: 'video', url: '#', caption: 'Video Essay: Composition' },
        { type: 'image', url: '/placeholder-film-still-2.jpg', caption: 'Scene Analysis' },
        { type: 'image', url: '/placeholder-film-still-3.jpg', caption: 'Color Palette' },
    ];

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-background text-foreground overflow-hidden">

            {/* --- COLUMN 1: Movie Metadata (Sticky Left) --- */}
            {/* Added nuanced gradient: Black -> Very Dark Zinc */}
            <aside className="w-full lg:w-[18%] h-screen overflow-y-auto border-r border-white/5 bg-gradient-to-b from-black to-zinc-950 p-6 flex flex-col gap-6 hide-scrollbar z-30 shrink-0">
                <Link href="/" className="text-xs text-zinc-500 hover:text-white mb-4 block transition-colors tracking-widest uppercase">
                    ← Archive
                </Link>

                {/* Poster - Slightly darker shadow for separation */}
                <div className="relative aspect-[2/3] w-full shadow-2xl rounded-sm overflow-hidden border border-white/5 group">
                    {movie.metadata?.posterUrl ? (
                        <Image
                            src={movie.metadata.posterUrl}
                            alt={movie.title}
                            fill
                            sizes="(max-width: 1200px) 100vw, 20vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                    ) : (
                        <div className="bg-zinc-900 w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                            NO IMAGE
                        </div>
                    )}
                    {/* Overlay gradient on poster for integration */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Info */}
                <div className="space-y-4">
                    <h1 className="text-xl font-bold font-serif leading-tight text-zinc-100">{movie.title}</h1>

                    <div className="text-[10px] text-zinc-500 space-y-2 uppercase tracking-wide font-mono">
                        <p><span className="text-zinc-600 block mb-0.5">Director</span> {movie.metadata?.director || 'Unknown'}</p>
                        <p><span className="text-zinc-600 block mb-0.5">Year</span> {movie.metadata?.year || 'Unknown'}</p>
                        <p><span className="text-zinc-600 block mb-0.5">Country</span> {movie.metadata?.country || 'Unknown'}</p>
                    </div>
                </div>
            </aside>

            {/* --- COLUMN 2: Navigation (Sticky) --- */}
            {/* Lighter gradient than Col 1 to distinguish hierarchy */}
            <nav className="w-full lg:w-[15%] h-screen overflow-y-auto border-r border-white/5 bg-gradient-to-b from-zinc-950 to-zinc-900/50 hide-scrollbar z-20 shrink-0">
                <div className="p-6 pt-12">
                    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6 px-3">Index</h3>
                    <ul className="space-y-1">
                        {BATCH_CATEGORIES.map((category) => {
                            const matchingArticle = articles.find(a =>
                                (a.categoryTitle || '').toUpperCase() === category.toUpperCase()
                            );
                            const isActive = matchingArticle && activeArticleId === matchingArticle.id;
                            const hasContent = !!matchingArticle;

                            return (
                                <li key={category}>
                                    <button
                                        onClick={() => matchingArticle && setActiveArticleId(matchingArticle.id)}
                                        disabled={!hasContent}
                                        className={clsx(
                                            "w-full text-left px-3 py-2.5 text-xs transition-all duration-300 border-l-[1px] flex justify-between items-center group",
                                            isActive
                                                ? "border-purple-500 text-white bg-white/5"
                                                : hasContent
                                                    ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700"
                                                    : "border-transparent text-zinc-700 cursor-default"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Micro-dot indicator */}
                                            <span className={clsx(
                                                "w-1 h-1 rounded-full transition-all duration-300",
                                                isActive ? "bg-purple-500 scale-125 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : hasContent ? "bg-zinc-700 group-hover:bg-zinc-500" : "bg-transparent"
                                            )} />
                                            <span>{category}</span>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}

                        {/* Render other categories not in batch list */}
                        {articles
                            .filter(a => !BATCH_CATEGORIES.some(c => c.toUpperCase() === (a.categoryTitle || '').toUpperCase()))
                            .map(article => {
                                const isActive = activeArticleId === article.id;
                                return (
                                    <li key={article.id}>
                                        <button
                                            onClick={() => setActiveArticleId(article.id)}
                                            className={clsx(
                                                "w-full text-left px-3 py-2.5 text-xs transition-all duration-300 border-l-[1px] flex justify-between items-center group",
                                                isActive
                                                    ? "border-purple-500 text-white bg-white/5"
                                                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={clsx(
                                                    "w-1 h-1 rounded-full transition-all duration-300",
                                                    isActive ? "bg-purple-500 scale-125 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-zinc-700 group-hover:bg-zinc-500"
                                                )} />
                                                <span>{article.categoryTitle || article.title}</span>
                                            </div>
                                        </button>
                                    </li>
                                )
                            })
                        }
                    </ul>
                </div>
            </nav>

            {/* --- COLUMN 3: Main Layout Content (Scrollable) --- */}
            {/* The "Paper" - darkest and cleanest for reading */}
            <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0a] relative flex flex-col">
                {activeArticle ? (
                    <div className="w-full max-w-3xl mx-auto px-12 py-20 min-h-full">
                        {/* Header */}
                        <header className="mb-12 border-b border-white/5 pb-8">
                            <span className="text-[9px] font-mono text-purple-500/70 mb-4 block uppercase tracking-[0.3em]">
                                {activeArticle.categoryTitle || 'Entry'}
                            </span>
                            <h2 className="text-4xl lg:text-5xl font-serif text-white/90 leading-tight tracking-tight">
                                {activeArticle.title}
                            </h2>
                        </header>

                        {/* Content */}
                        <div className="prose prose-invert prose-lg max-w-none font-serif text-zinc-400 leading-loose prose-headings:text-zinc-200 prose-strong:text-zinc-300">
                            <MarkdownViewer content={activeArticle.content} />
                        </div>

                        {/* Footer Mark */}
                        <div className="mt-32 flex justify-center opacity-20">
                            <span className="text-2xl font-serif text-zinc-500">❧</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4">
                        <p className="text-xs font-mono uppercase tracking-widest">Select an entry from the index</p>
                    </div>
                )}
            </main>

            {/* --- COLUMN 4: Related Media (New, Independent Scroll) --- */}
            {/* Mirroring Column 1 in width, but distinct styling for media focus */}
            <aside className="w-full lg:w-[18%] h-screen overflow-y-auto border-l border-white/5 bg-gradient-to-b from-[#050505] to-black hide-scrollbar shrink-0 z-20">
                <div className="p-6">
                    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8 sticky top-0 bg-[#050505]/95 backdrop-blur-sm py-4 z-10 border-b border-white/5">
                        Related Media
                    </h3>

                    <div className="space-y-8">
                        {/* Placeholder Content Blocks */}
                        {relatedMedia.map((media, idx) => (
                            <div key={idx} className="group cursor-pointer">
                                <div className="aspect-video w-full bg-zinc-900 rounded-sm overflow-hidden relative border border-white/5 group-hover:border-purple-500/30 transition-colors duration-300">
                                    {/* Placeholder Visual */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {media.type === 'video' ? (
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-purple-500/20 transition-colors">
                                                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white/70 border-b-[6px] border-b-transparent ml-1"></div>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-700 text-[10px] font-mono">IMG</span>
                                        )}
                                    </div>

                                    {/* Mock Image Background */}
                                    <div className={`absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 opacity-50 group-hover:scale-105 transition-transform duration-700`} />
                                </div>
                                <div className="mt-3">
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                                        {media.caption}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* More filler content to enable scrolling */}
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`filler-${i}`} className="group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                                <div className="aspect-square w-full bg-zinc-900/30 rounded-sm border border-white/5 mb-2"></div>
                                <div className="h-2 w-1/2 bg-zinc-900 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

        </div>
    );
}

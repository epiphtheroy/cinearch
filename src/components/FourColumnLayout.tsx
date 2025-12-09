'use client';

import { useState, useEffect } from 'react';
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
    console.log(`[FourColumnLayout] Rendered. Articles: ${articles.length}, Mobie: ${movie.title}`);
    const [activeArticleId, setActiveArticleId] = useState<string | null>(articles[0]?.id || null);

    const activeArticle = articles.find(a => a.id === activeArticleId);

    const [hasVisual, setHasVisual] = useState<boolean>(false);

    useEffect(() => {
        if (!activeArticleId) {
            setHasVisual(false);
            return;
        }

        const checkVisual = async () => {
            setHasVisual(false);
            try {
                const res = await fetch(`/generated_visuals/${activeArticleId}.html`, { method: 'HEAD' });
                if (res.ok) {
                    setHasVisual(true);
                }
            } catch {
                setHasVisual(false);
            }
        };
        checkVisual();
    }, [activeArticleId]);

    // Placeholder data for the new Media Column
    const relatedMedia = [
        { type: 'image', url: '/placeholder-film-still-1.jpg', caption: 'Visual Inspiration' },
        { type: 'video', url: '#', caption: 'Video Essay: Composition' },
        { type: 'image', url: '/placeholder-film-still-2.jpg', caption: 'Scene Analysis' },
        { type: 'image', url: '/placeholder-film-still-3.jpg', caption: 'Color Palette' },
    ];

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-background text-foreground overflow-x-hidden lg:overflow-hidden">

            {/* --- COLUMN 1: Movie Metadata (Sticky Left) --- */}
            {/* Added nuanced gradient: Black -> Very Dark Zinc */}
            <aside className="w-full lg:w-[18%] h-screen overflow-y-auto bg-gradient-to-b from-black to-zinc-950 p-6 flex flex-col gap-6 hide-scrollbar z-30 shrink-0 relative">
                {/* Gradient Border Right */}
                <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-red-900 via-yellow-900/50 to-blue-900 opacity-80 pointer-events-none"></div>

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
            {/* Reduced width to ~8% (approx half of 15%), Lighter gradient */}
            <nav className="w-full lg:w-[8%] h-screen overflow-y-auto bg-gradient-to-b from-zinc-950 to-zinc-900/50 hide-scrollbar z-20 shrink-0 relative">
                {/* Gradient Border Right */}
                <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-blue-900 via-red-900/50 to-yellow-900 opacity-80 pointer-events-none"></div>

                <div className="py-6 flex flex-col">
                    <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-6 px-3">Index</h3>

                    <ul className="space-y-1 w-full">
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
                                        title={category}
                                        className={clsx(
                                            "w-full text-left px-3 py-2 text-xs transition-all duration-300 border-l-[2px] flex items-center gap-2 group relative",
                                            isActive
                                                ? "border-red-500 text-white bg-white/5"
                                                : hasContent
                                                    ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                                    : "border-transparent text-zinc-700 cursor-default"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300",
                                            isActive ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : hasContent ? "bg-zinc-600 group-hover:bg-zinc-400" : "bg-transparent"
                                        )} />
                                        <span className={clsx("truncate", !hasContent && "opacity-50")}>{category}</span>
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
                                            title={article.title}
                                            className={clsx(
                                                "w-full text-left px-3 py-2 text-xs transition-all duration-300 border-l-[2px] flex items-center gap-2 group relative",
                                                isActive
                                                    ? "border-blue-500 text-white bg-white/5"
                                                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300",
                                                isActive ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-zinc-600 group-hover:bg-zinc-400"
                                            )} />
                                            <span className="truncate">{article.categoryTitle || article.title}</span>
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
                    <div className="w-full max-w-3xl mx-auto px-8 lg:px-16 py-20 min-h-full">
                        {/* Header */}
                        <header className="mb-12 pb-8 relative">
                            {/* Decorative gradient line */}
                            <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-gradient-to-r from-red-900 via-yellow-900 to-blue-900 opacity-50"></div>

                            <span className="text-[9px] font-mono text-zinc-500 mb-4 block uppercase tracking-[0.3em]">
                                {activeArticle.categoryTitle || 'Entry'}
                            </span>
                            <h2 className="text-3xl lg:text-5xl font-serif text-white/90 leading-tight tracking-tight">
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
                        <p className="text-xs font-mono uppercase tracking-widest">Select an entry</p>
                    </div>
                )}
            </main>

            {/* --- COLUMN 4: Generated Visuals / Related Media --- */}
            {/* Increased width to ~25% (18% + 7%), Distinct styling */}
            <aside className="w-full lg:w-[25%] h-screen overflow-hidden bg-gradient-to-b from-[#050505] to-black relative z-20">
                {/* Gradient Border Left */}
                <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-yellow-900 via-blue-900/50 to-red-900 opacity-80 z-10 pointer-events-none"></div>

                {activeArticle && hasVisual ? (
                    <div className="w-full h-full relative group">
                        {/* Valid Generated HTML Exists */}
                        <iframe
                            key={activeArticle.id}
                            src={`/generated_visuals/${activeArticle.id}.html`}
                            className="w-full h-full border-none bg-black"
                            title="Generated Visual"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[10px] text-zinc-500 bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                                {activeArticle.id}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto hide-scrollbar">
                        <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8 sticky top-0 bg-[#050505]/95 backdrop-blur-sm py-4 z-10 border-b border-transparent">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-800 to-blue-800">Related Media</span>
                        </h3>
                        {/* Placeholder/Default Content */}
                        <div className="space-y-8">
                            {relatedMedia.map((media, idx) => (
                                <div key={idx} className="group cursor-pointer">
                                    <div className="aspect-video w-full bg-zinc-900 rounded-sm overflow-hidden relative border border-white/5 group-hover:border-white/10 transition-colors duration-300">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {media.type === 'video' ? (
                                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md group-hover:bg-red-900/20 group-hover:border-red-500/30 transition-all">
                                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white/70 border-b-[6px] border-b-transparent ml-1"></div>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-800 text-[10px] font-mono group-hover:text-zinc-500 transition-colors">IMG</span>
                                            )}
                                        </div>
                                        <div className={`absolute inset-0 bg-gradient-to-br from-zinc-900 to-black opacity-80 group-hover:opacity-60 transition-opacity duration-700`} />
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="w-1 h-1 rounded-full bg-zinc-800 group-hover:bg-blue-800 transition-colors"></span>
                                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                                            {media.caption}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </aside>

        </div>
    );
}

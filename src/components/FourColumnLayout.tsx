'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import MarkdownViewer from './MarkdownViewer';
import { clsx } from 'clsx';
import Link from 'next/link';
import axios from 'axios';
import { BATCH_CATEGORIES } from '@/config/prompts';

interface Article {
    id: string;
    title: string;
    content: string;
    categoryTitle?: string;
    keywords?: string[];
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
    console.log(`[FourColumnLayout] Rendered. Articles: ${articles.length}, Data: ${movie.title}`);

    const [activeArticleId, setActiveArticleId] = useState<string | null>(articles[0]?.id || null);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Sidebar Data State

    const [sidebarData, setSidebarData] = useState<any>(null);

    // Random Shuffle State
    const [mediaPool, setMediaPool] = useState<{ allVideos: any[], backdrops: any[], posters: any[] }>({ allVideos: [], backdrops: [], posters: [] });
    const [displayMedia, setDisplayMedia] = useState<{ videos: any[], images: any[] }>({ videos: [], images: [] });
    const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

    const shuffle = (array: any[], count: number) => {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const refreshContent = (pool: { allVideos: any[], backdrops: any[], posters: any[] }) => {
        if (!pool.allVideos && !pool.backdrops) return;

        // 1. Videos: Pick 3 random
        const selectedVideos = shuffle(pool.allVideos || [], 3);

        // 2. Images: Pick 3 Posters (vertical) + 17 Backdrops (horizontal)
        const selectedPosters = shuffle(pool.posters || [], 3);
        const selectedBackdrops = shuffle(pool.backdrops || [], 17);

        // Mix: 3 Posters + 17 Backdrops = 20 total.
        const mixedImages = [...selectedPosters, ...selectedBackdrops];

        setDisplayMedia({
            videos: selectedVideos,
            images: mixedImages
        });
        setPlayingVideoId(null); // Reset player
    };

    useEffect(() => {
        if (movie?.id) {
            // Fetch Media
            axios.get(`/api/movie/${movie.id}/media`).then(res => {
                const pool = res.data;
                setMediaPool(pool);
                refreshContent(pool);
            }).catch(err => console.error("Failed to fetch media:", err));

            // Fetch Sidebar Data
            axios.get(`/api/movie/${movie.id}/sidebar`).then(res => {
                setSidebarData(res.data);
            }).catch(err => console.error("Failed to fetch sidebar:", err));
        }
    }, [movie?.id]);

    const activeArticle = articles.find(a => a.id === activeArticleId);

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-background text-foreground overflow-x-hidden lg:overflow-hidden">

            {/* --- COLUMN 1: Movie Metadata (Sticky Left) --- */}
            {/* Width: ~18% */}
            <aside className="w-full lg:w-[18%] h-screen overflow-y-auto bg-gradient-to-b from-black to-zinc-950 p-6 flex flex-col gap-6 hide-scrollbar z-30 shrink-0 relative border-r border-white/5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {/* Gradient Border Right */}
                <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-red-900 via-yellow-900/50 to-blue-900 opacity-80 pointer-events-none"></div>

                <Link href="/" className="text-xs text-zinc-500 hover:text-white mb-4 block transition-colors tracking-widest uppercase">
                    ← Archive
                </Link>

                {/* Poster */}
                <div className="relative aspect-[2/3] w-full shadow-2xl rounded-sm overflow-hidden border border-white/5 group bg-zinc-900 shrink-0">
                    {(() => {
                        const posterSrc = sidebarData?.poster_path
                            ? `https://image.tmdb.org/t/p/w500${sidebarData.poster_path}`
                            : movie.metadata?.posterUrl;

                        return posterSrc ? (
                            <Image
                                src={posterSrc}
                                alt={movie.title}
                                fill
                                priority
                                sizes="(max-width: 1200px) 100vw, 20vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                            />
                        ) : (
                            <div className="bg-zinc-900 w-full h-full flex items-center justify-center text-zinc-700 text-xs">
                                NO IMAGE
                            </div>
                        );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Info */}
                <div className="space-y-5">
                    <h1 className="text-xl font-bold font-serif leading-tight text-zinc-100">{sidebarData?.title || movie.title}</h1>

                    {/* Original Title */}
                    {sidebarData?.original_title && sidebarData.original_title !== (sidebarData?.title || movie.title) && (
                        <div className="bg-zinc-900/30 p-2 rounded border border-zinc-800">
                            <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Original Title</span>
                            <span className="text-zinc-300 font-medium italic text-xs">{sidebarData.original_title}</span>
                        </div>
                    )}

                    <div className="text-xs space-y-4 font-mono">

                        {/* Release Release & Runtime */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Release</span>
                                <span className="text-zinc-200 font-bold">{sidebarData?.release_date || '-'}</span>
                            </div>
                            <div className="bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
                                <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Runtime</span>
                                <span className="text-zinc-200 font-bold">{movie.metadata?.runtime ? `${movie.metadata.runtime}m` : '-'}</span>
                            </div>
                        </div>

                        {/* Country & Company */}
                        <div className="space-y-2">
                            <div>
                                <span className="text-blue-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Origin</span>
                                <div className="flex flex-wrap gap-1">
                                    {sidebarData?.countries?.map((c: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-blue-900/30 text-blue-200 rounded border border-blue-900/50 text-[10px]">{c}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-purple-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Production</span>
                                <div className="flex flex-wrap gap-1">
                                    {sidebarData?.companies?.slice(0, 3).map((c: string, i: number) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-purple-900/30 text-purple-200 rounded border border-purple-900/50 truncate max-w-full text-[10px]">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-emerald-900/20 p-2.5 rounded border border-emerald-900/30">
                                <span className="text-emerald-600 block text-[10px] uppercase tracking-wider mb-1">Budget</span>
                                <span className="text-emerald-400 font-bold text-[10px]">{sidebarData?.budget ? `$${(sidebarData.budget / 1000000).toFixed(1)}M` : '-'}</span>
                            </div>
                            <div className="bg-green-900/20 p-2.5 rounded border border-green-900/30">
                                <span className="text-green-600 block text-[10px] uppercase tracking-wider mb-1">Revenue</span>
                                <span className="text-green-400 font-bold text-[10px]">{sidebarData?.revenue ? `$${(sidebarData.revenue / 1000000).toFixed(1)}M` : '-'}</span>
                            </div>
                        </div>

                        {/* Crew Badges */}
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                            {/* Director */}
                            <div className="bg-red-950/30 p-2.5 rounded border border-red-900/50 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <span className="text-red-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Director</span>
                                    <span className="text-red-100 text-sm font-bold block">{sidebarData?.director?.name || '-'}</span>
                                    {sidebarData?.director && (
                                        <div className="mt-2 text-[10px] text-red-400 opacity-80 grid grid-cols-1 gap-0.5">
                                            <span>Born: {sidebarData.director.birthday || '?'}</span>
                                            {sidebarData.director.deathday && <span>Died: {sidebarData.director.deathday}</span>}
                                            <span>{sidebarData.director.place_of_birth}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Writer */}
                            {sidebarData?.writers?.length > 0 && (
                                <div className="bg-orange-950/30 p-2.5 rounded border border-orange-900/50">
                                    <span className="text-orange-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Writing</span>
                                    <div className="flex flex-wrap gap-1">
                                        {sidebarData.writers.map((w: string, i: number) => (
                                            <span key={i} className="text-orange-200 font-medium text-[10px]">{w}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DP & Music */}
                            <div className="grid grid-cols-1 gap-1">
                                {sidebarData?.dp && (
                                    <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800">
                                        <span className="text-zinc-500 uppercase text-[10px]">Camera</span>
                                        <span className="text-zinc-300 text-right text-[10px]">{sidebarData.dp}</span>
                                    </div>
                                )}
                                {sidebarData?.composer && (
                                    <div className="flex justify-between items-center bg-zinc-900 p-2 rounded border border-zinc-800">
                                        <span className="text-zinc-500 uppercase text-[10px]">Music</span>
                                        <span className="text-zinc-300 text-right text-[10px]">{sidebarData.composer}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cast */}
                        <div className="pt-2 border-t border-zinc-800 space-y-2">
                            <span className="text-pink-500 font-bold uppercase tracking-wider text-[10px] block">Starring</span>
                            {sidebarData?.cast?.map((actor: any, i: number) => (
                                <a
                                    key={i}
                                    href={`https://www.themoviedb.org/person/${actor.id}`}
                                    target="_blank"
                                    className="flex justify-between items-start bg-pink-900/10 p-2 rounded border border-pink-900/30 hover:bg-pink-900/20 hover:border-pink-500/50 transition-colors group"
                                >
                                    <span className="text-pink-200 font-bold group-hover:text-pink-100 transition-colors">{actor.name}</span>
                                    <span className="text-pink-400/70 text-right text-[10px] italic">{actor.character}</span>
                                </a>
                            ))}
                        </div>

                        {/* Links */}
                        <div className="flex gap-2 pt-4 pb-10">
                            {sidebarData?.imdb_id && (
                                <a
                                    href={`https://www.imdb.com/title/${sidebarData.imdb_id}`}
                                    target="_blank"
                                    className="flex-1 bg-[#F5C518] text-black font-bold text-center py-2 rounded text-xs hover:bg-[#E2B616] transition-colors"
                                >
                                    IMDb
                                </a>
                            )}
                            {sidebarData?.tmdb_id && (
                                <a
                                    href={`https://www.themoviedb.org/movie/${sidebarData.tmdb_id}`}
                                    target="_blank"
                                    className="flex-1 bg-[#01B4E4] text-white font-bold text-center py-2 rounded text-xs hover:bg-[#00A0CC] transition-colors"
                                >
                                    TMDB
                                </a>
                            )}
                        </div>

                    </div>
                </div>
            </aside>

            {/* --- COLUMN 2: Navigation (Sticky) --- */}
            {/* Width: ~8% */}
            <nav className="w-full lg:w-[8%] h-screen overflow-y-auto bg-black hide-scrollbar z-20 shrink-0 relative border-r border-white/5">

                <div className="py-8 flex flex-col px-1">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 px-3 border-b border-zinc-900 pb-2">Index</h3>

                    <ul className="space-y-2 w-full">
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
                                            "w-full text-left px-4 py-3 text-sm transition-all duration-300 flex items-center gap-3 group relative rounded-r-md",
                                            isActive
                                                ? "text-white bg-zinc-900 translate-x-1"
                                                : hasContent
                                                    ? "text-zinc-500 hover:text-white hover:bg-zinc-900/50 hover:translate-x-1"
                                                    : "text-zinc-800 cursor-default"
                                        )}
                                    >
                                        {/* Dynamic Indicator */}
                                        <div className={clsx(
                                            "w-1 h-full absolute left-0 top-0 transition-all duration-300",
                                            isActive ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-transparent group-hover:bg-zinc-700"
                                        )} />

                                        {/* Dot */}
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full shrink-0 transition-all duration-500",
                                            isActive
                                                ? "bg-red-500 scale-125"
                                                : hasContent
                                                    ? "bg-zinc-800 group-hover:bg-zinc-400 group-hover:scale-110"
                                                    : "bg-zinc-900"
                                        )} />

                                        <span className={clsx(
                                            "truncate font-medium tracking-wide transition-all duration-300",
                                            isActive && "text-red-500",
                                            !hasContent && "opacity-30 blur-[0.5px]"
                                        )}>
                                            {category}
                                        </span>
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
            {/* Taking ~49% of width to leave room for 4th column */}
            <main className="flex-1 h-screen overflow-y-auto bg-[#0a0a0a] relative flex flex-col border-r border-zinc-900/50">
                {activeArticle ? (
                    <div className="w-full max-w-2xl mx-auto px-8 lg:px-12 py-20 min-h-full">
                        {/* Header */}
                        <header className="mb-12 pb-8 relative">
                            {/* Decorative gradient line */}
                            <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-gradient-to-r from-red-900 via-yellow-900 to-blue-900 opacity-50"></div>

                            <span className="text-[9px] font-mono text-zinc-500 mb-4 block uppercase tracking-[0.3em]">
                                {activeArticle.categoryTitle || 'Entry'}
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-serif text-white/90 leading-tight tracking-tight">
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

            {/* --- COLUMN 4: Media Gallery (Fixed Right - Scrollable) --- */}
            {/* Width: ~25% */}
            <aside className="w-full lg:w-[25%] h-screen overflow-y-auto bg-black relative z-20 border-l border-zinc-800/30 hide-scrollbar">
                <div className="flex flex-col min-h-full">
                    <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-900 sticky top-0 z-10 flex justify-between items-center backdrop-blur-md bg-opacity-80">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Archive Media</span>
                        <button
                            onClick={() => refreshContent(mediaPool)}
                            className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Random
                        </button>
                    </div>

                    <div className="p-4 space-y-8 pb-20">
                        {/* Videos Section */}
                        {displayMedia.videos.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] text-red-700 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-700 rounded-full"></span>
                                    Official Footage
                                </h4>
                                <div className="space-y-4">
                                    {displayMedia.videos.map((video) => (
                                        <div key={video.id} className="group">
                                            {playingVideoId === video.id ? (
                                                <div className="relative aspect-video rounded-sm overflow-hidden border border-zinc-800 bg-black">
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${video.key}?autoplay=1`}
                                                        title={video.name}
                                                        className="w-full h-full"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => setPlayingVideoId(video.id)}
                                                    className="block relative aspect-video rounded-sm overflow-hidden border border-zinc-900 transition-all duration-300 cursor-pointer group-hover:shadow-[0_0_15px_rgba(255,0,0,0.3)] hover:border-red-500/50"
                                                >
                                                    <Image
                                                        src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                                                        alt={video.name}
                                                        fill
                                                        className="object-cover opacity-100 transition-all duration-500"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-red-600 group-hover:border-red-500 transition-all">
                                                            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mt-2 text-[10px] text-zinc-400 group-hover:text-zinc-200 line-clamp-2 leading-relaxed">
                                                {video.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Images Section */}
                        {displayMedia.images.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 bg-zinc-700 rounded-full"></span>
                                    Gallery
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {displayMedia.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="relative w-full rounded-sm overflow-hidden border border-zinc-900 bg-zinc-900 shadow-sm cursor-pointer group transition-all duration-300 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                            style={{ aspectRatio: img.aspect_ratio }}
                                            onClick={() => setLightboxImage(img.file_path)}
                                        >
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
                                                alt="Movie Still"
                                                fill
                                                className="object-cover opacity-100 transition-transform duration-700 group-hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, 25vw"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {displayMedia.videos.length === 0 && displayMedia.images.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-zinc-700 space-y-2">
                                <p className="text-xs font-mono uppercase tracking-widest">No Media Found</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Lightbox Overlay */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors border border-white/20 rounded-full p-2 z-60"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center">
                        <Image
                            src={`https://image.tmdb.org/t/p/original${lightboxImage}`}
                            alt="Full View"
                            fill
                            className="object-contain"
                            quality={100}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}

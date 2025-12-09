'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Shuffle } from 'lucide-react';
// import Navbar from './Navbar'; // Removed

interface Article {
    id: string;
    title: string;
    movieTitle: string;
    content: string;
    categoryName: string;
    movieIdStr: string;
    updatedAt: string;
}

export default function BlogGrid({ initialArticles }: { initialArticles: Article[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [isShuffling, setIsShuffling] = useState(false);

    // Filter effect
    useEffect(() => {
        if (!searchTerm) {
            setArticles(initialArticles);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = initialArticles.filter(a =>
            a.title.toLowerCase().includes(lowerTerm) ||
            a.movieTitle.toLowerCase().includes(lowerTerm) ||
            a.content.toLowerCase().includes(lowerTerm)
        );
        setArticles(filtered);
    }, [searchTerm, initialArticles]);

    const handleShuffle = () => {
        setIsShuffling(true);
        // Fisher-Yates Shuffle
        const shuffled = [...articles];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setArticles(shuffled);

        // Quick visual feedback reset
        setTimeout(() => setIsShuffling(false), 500);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F9F9F9] font-sans selection:bg-black selection:text-white">

            {/* Hero / Search Section */}
            <div className="pt-24 pb-16 px-6 max-w-[800px] mx-auto w-full text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-[#15171A]">
                    Knowledge Base
                </h1>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for ideas, movies, or concepts..."
                        className="w-full py-4 pl-14 pr-6 bg-white rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black text-lg transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 md:px-10 max-w-[1300px] mx-auto w-full flex justify-end mb-6">
                <button
                    onClick={handleShuffle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isShuffling ? 'bg-black text-white scale-95' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black shadow-sm border border-gray-100'}`}
                >
                    <Shuffle size={16} className={isShuffling ? 'animate-spin' : ''} />
                    <span>Randomize</span>
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 px-6 md:px-10 max-w-[1300px] mx-auto w-full pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <Link
                            key={article.id}
                            href={`/movie/${article.movieIdStr}`}
                            className="group flex flex-col bg-white rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-black/5"
                        >
                            <div className="p-8 flex flex-col h-full">
                                <div className="text-[11px] font-bold uppercase tracking-widest text-red-700 mb-3">
                                    {article.categoryName}
                                </div>
                                <h2 className="text-2xl font-bold text-[#15171A] mb-3 leading-tight group-hover:text-red-900 transition-colors">
                                    {article.title}
                                </h2>
                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                                    {article.content.replace(/[#*`]/g, '')}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                    <span className="text-xs font-semibold text-[#15171A]">
                                        {article.movieTitle}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {articles.length === 0 && (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg">No articles found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}

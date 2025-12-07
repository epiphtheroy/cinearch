'use client';

import { clsx } from 'clsx';
import RatingComponent from './RatingComponent';

interface Article {
    id: string;
    // categoryId removed
    categoryName: string;
}

interface SidebarProps {
    articles: Article[];
    selectedArticleId: string | null;
    onSelect: (id: string) => void;
    movie: any;
}

export default function Sidebar({ articles, selectedArticleId, onSelect, movie }: SidebarProps) {
    return (
        <div className="w-full md:w-80 flex-shrink-0 bg-gray-900 border-r border-gray-800 h-screen overflow-y-auto sticky top-0">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold mb-2">{movie.title}</h2>
                <p className="text-sm text-gray-400">{movie.metadata?.year} • {movie.metadata?.director}</p>

                <div className="mt-6">
                    <RatingComponent movieId={movie.id} />
                </div>
            </div>

            <nav className="p-4">
                <ul className="space-y-1">
                    {articles.map((article) => (
                        <li key={article.id}>
                            <button
                                onClick={() => onSelect(article.id)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 rounded-lg text-sm transition-colors",
                                    selectedArticleId === article.id
                                        ? "bg-purple-600 text-white font-medium"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                {/* Removed categoryId display */}
                                {article.categoryName}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MarkdownViewer from './MarkdownViewer';
import { Menu, X } from 'lucide-react';

export default function SplitView({ movie, articles }: { movie: any, articles: any[] }) {
    // Sort articles by categoryId
    const sortedArticles = [...articles].sort((a, b) => a.categoryId - b.categoryId);

    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(
        sortedArticles.length > 0 ? sortedArticles[0].id : null
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const selectedArticle = sortedArticles.find(a => a.id === selectedArticleId);

    return (
        <div className="flex min-h-screen bg-gray-950 text-white">
            {/* Mobile Menu Button */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gray-800 rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar (Desktop: Static, Mobile: Drawer) */}
            <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <Sidebar
                    movie={movie}
                    articles={sortedArticles}
                    selectedArticleId={selectedArticleId}
                    onSelect={(id) => {
                        setSelectedArticleId(id);
                        setIsMobileMenuOpen(false);
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
                {selectedArticle ? (
                    <MarkdownViewer content={selectedArticle.content} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select an article to read
                    </div>
                )}
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}

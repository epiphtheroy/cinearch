'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownViewer({ content }: { content: string }) {
    return (
        <div className="prose prose-invert max-w-none p-8">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}

'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownViewer({ content }: { content: string }) {
    return <ReactMarkdown>{content}</ReactMarkdown>;
}

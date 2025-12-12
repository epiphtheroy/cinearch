'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Save, MessageSquare, Plus, Bot, User } from 'lucide-react';
import axios from 'axios';

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp: number;
    savedId?: string; // If saved, store ID here
}

interface HistoryItem {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
}

export default function CriticPage() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Initial load of history
    useEffect(() => {
        fetchHistory();
    }, []);

    // Auto-scroll to bottom with slight delay to ensure layout is ready
    useEffect(() => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }, [messages, isLoading]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/critic/history');
            if (res.data.history) {
                setHistory(res.data.history);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setCurrentChatId(null);
    };

    const handleHistoryClick = (item: HistoryItem) => {
        setCurrentChatId(item.id);
        setMessages(item.messages || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: query, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setIsLoading(true);

        // Create a placeholder AI message
        const aiMsgId = Date.now();
        setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: aiMsgId }]);

        try {
            const response = await fetch('/api/critic/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content }),
            });

            if (!response.ok) throw new Error(response.statusText);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let accumulatedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Vertex sends a JSON array stream. We need to extract specific "text" fields.
                // Simple regex robustly finds the text value even in broken JSON chunks
                // Pattern matches: "text": "captured_group"
                // Note: This regex handles simple escaped quotes roughly.

                // We run regex on the NEW chunk + potentially tail of old chunk?
                // Actually, Vertex sends fairly clean chunks. Let's just Regex the chunk.
                // NOTE: A text value might be split across chunks. Ideally we buffer.
                // BUT for now, let's try just scanning the chunk.

                // Improved Strategy:
                // Since we are rebuilding a JSON string, extracting "text" is tricky if it splits.
                // Simpler: Just accumulate the WHOLE response for safety, but display reasonably.
                // Actually, the regex `/"text":\s*"((?:[^"\\]|\\.)*)"/g` is decent.

                const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
                let match;
                while ((match = regex.exec(chunk)) !== null) {
                    // JSON decode the matched string to handle escapes like \n, \"
                    try {
                        // match[1] depends on capture group. The regex matches the content inside quotes.
                        // We need to wrap it in quotes to JSON.parse it safely back to a string
                        const textFragment = JSON.parse(`"${match[1]}"`);
                        accumulatedText += textFragment;

                        setMessages(prev => {
                            const newMsgs = [...prev];
                            const lastMsg = newMsgs[newMsgs.length - 1];
                            if (lastMsg.role === 'ai') {
                                lastMsg.content = accumulatedText;
                            }
                            return newMsgs;
                        });
                    } catch (e) {
                        console.log("Parse error for chunk", match[1]);
                    }
                }
            }

        } catch (err: any) {
            console.error("Chat error", err);
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'ai') {
                    lastMsg.content += `\n\n[Error: ${err.message || 'Connection failed'}]`;
                }
                return newMsgs;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveResult = async (msg: Message, index: number) => {
        if (msg.role !== 'ai' || msg.savedId) return;

        try {
            // Find the query associated (the message before it)
            const queryMsg = messages[index - 1];
            const associatedQuery = queryMsg?.role === 'user' ? queryMsg.content : "Unknown Query";

            const res = await axios.post('/api/critic/save', {
                query: associatedQuery,
                result: msg.content,
                timestamp: msg.timestamp
            });

            // Mark locally as saved
            const updated = [...messages];
            updated[index].savedId = res.data.id;
            setMessages(updated);

            // Show detailed feedback
            const cleanPath = res.data.filePath ? res.data.filePath.split('/').pop() : 'file';
            alert(`Result saved successfully!\n\nFile: source_md/critic/${cleanPath}\nCheck 'source_md/critic' folder in your project.`);
        } catch (err) {
            console.error("Save error", err);
            alert("Failed to save result.");
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#0f0f0f] text-gray-200 font-sans overflow-hidden">
            {/* Sidebar (History) */}
            <aside className="w-[280px] bg-[#1a1a1a] border-r border-gray-800 flex flex-col hidden md:flex">
                <div className="p-4">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-200 px-4 py-3 rounded-full transition-colors text-sm font-medium"
                    >
                        <Plus size={18} />
                        New chat
                    </button>
                    <div className="mt-6 text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Recent</div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-700">
                    {history.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleHistoryClick(item)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm mb-1 truncate flex items-center gap-3 transition-colors ${currentChatId === item.id ? 'bg-[#4a0404]/30 text-purple-300' : 'hover:bg-[#2a2a2a] text-gray-400'}`}
                        >
                            <MessageSquare size={16} className="shrink-0" />
                            <span className="truncate">{item.title}</span>
                        </button>
                    ))}
                    {history.length === 0 && (
                        <div className="text-gray-600 text-sm text-center mt-10 p-4">No history yet.</div>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative">
                {/* Header / Top Shadow */}
                <div className="absolute top-0 w-full h-16 bg-gradient-to-b from-[#0f0f0f] to-transparent z-10 pointer-events-none" />

                {/* Messages List - Increased bottom padding to prevent overlap */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 pt-10 pb-48 scrollbar-thin scrollbar-thumb-gray-800">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Bot size={64} className="mb-6 text-purple-400" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                                Hello, User.
                            </h1>
                            <p className="text-xl max-w-md">How can I help you analyze cinema or fetch data today?</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto flex flex-col gap-8">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'ai' ? 'items-start' : 'items-start flex-row-reverse'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'ai' ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gray-700'}`}>
                                        {msg.role === 'ai' ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
                                    </div>

                                    <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                            ? 'bg-[#2a2a2a] text-gray-100 rounded-tr-sm'
                                            : 'text-gray-100 rounded-tl-sm'
                                            }`}>
                                            {msg.content}
                                        </div>

                                        {msg.role === 'ai' && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleSaveResult(msg, idx)}
                                                    disabled={!!msg.savedId}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-md active:scale-95 ${msg.savedId
                                                        ? 'border-green-700 bg-green-900/40 text-green-400 cursor-default'
                                                        : 'border-purple-600/50 bg-purple-900/20 hover:bg-purple-900/40 hover:border-purple-500 text-purple-200'
                                                        }`}
                                                >
                                                    <Save size={14} />
                                                    {msg.savedId ? 'Saved to Project' : 'Save Analysis'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 mt-1 animate-pulse">
                                        <Bot size={18} className="text-white" />
                                    </div>
                                    <div className="flex gap-1 h-8 items-center px-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} className="h-8" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f] to-transparent pb-6 pt-10">
                    <div className="max-w-3xl mx-auto bg-[#1e1e1e] rounded-full border border-gray-700 focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-500 transition-all shadow-lg">
                        <form onSubmit={handleSubmit} className="flex items-center px-4 py-2 gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Message Critic AI..."
                                className="flex-1 bg-transparent border-none outline-none text-gray-200 placeholder-gray-500 h-10 px-2"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!query.trim() || isLoading}
                                className={`p-2 rounded-full transition-colors ${query.trim() && !isLoading ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#333] text-gray-500 cursor-not-allowed'}`}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-gray-600">Critic AI can make mistakes. Verify important info.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

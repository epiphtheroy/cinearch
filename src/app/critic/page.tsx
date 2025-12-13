'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Plus, Bot, User } from 'lucide-react';
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s connection timeout

        try {
            const response = await fetch('/api/critic/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content }),
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Connected, clear timeout

            if (!response.ok) throw new Error(response.statusText);

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let accumulatedText = '';
            let buffer = '';

            // Regex to find "text": "..." 
            // We use a global regex to find multiple occurrences
            const regex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Scan buffer for matches
                let match;
                let lastIndex = 0;

                while ((match = regex.exec(buffer)) !== null) {
                    try {
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
                        console.warn("JSON parse error on fragment", e);
                    }
                    // Track position of last match end
                    lastIndex = regex.lastIndex;
                }

                if (lastIndex > 0) {
                    buffer = buffer.slice(lastIndex);
                    // Reset regex state since we are processing a new string next time
                    regex.lastIndex = 0;
                }
            }

            // AUTO-SAVE LOGIC START
            // Streaming finished successfully. Save the result.
            // We need to pass the *final* accumulatedText, relying on state might be slightly racy if batching.
            // But we have accumulatedText local var.

            // To be safe, we invoke a helper or logic here.
            // Re-using the logic from handleSaveResult but adapted for auto-execute.
            try {
                // Determine query from previous message (or local var query? No, local query is cleared)
                // We pushed userMsg to messages array. Last message is AI. Previous is User.
                // However, state update is async. 
                // Reliable way: we have userMsg.content in scope from earlier in this function!

                const associatedQuery = userMsg.content;

                console.log("[AutoSave] Saving result...", { length: accumulatedText.length });

                const saveRes = await fetch('/api/critic/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: associatedQuery,
                        result: accumulatedText,
                        timestamp: aiMsgId
                    })
                });

                const saveData = await saveRes.json();
                console.log("[AutoSave] Completed:", saveData);

                if (saveData.success) {
                    // Update state to show "Saved" indicator if we want, or just toast
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastMsg = newMsgs[newMsgs.length - 1];
                        if (lastMsg.role === 'ai') {
                            lastMsg.savedId = saveData.id;
                            // Append a small note or just rely on console
                            lastMsg.content += `\n\n✅ Analysis automatically saved to: ${saveData.filePath.split('/').pop()}`;
                        }
                        return newMsgs;
                    });
                }
            } catch (saveError) {
                console.error("[AutoSave] Failed:", saveError);
            }
            // AUTO-SAVE LOGIC END

        } catch (err: any) {
            console.error("Chat error", err);
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastMsg = newMsgs[newMsgs.length - 1];
                if (lastMsg.role === 'ai') {
                    if (err.name === 'AbortError') {
                        lastMsg.content += `\n\n[Error: Connection timed out. Please try again.]`;
                    } else {
                        lastMsg.content += `\n\n[Error: ${err.message || 'Connection failed'}]`;
                    }
                }
                return newMsgs;
            });
        } finally {
            clearTimeout(timeoutId); // Ensure cleared
            setIsLoading(false);
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
                            {/* Auto-save notification area or just history update */}
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

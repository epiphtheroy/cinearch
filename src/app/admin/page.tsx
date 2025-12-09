'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const handleGenerate = async () => {
        setLoading(true);
        setLogs(prev => [...prev, "Starting generation process..."]);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
            });
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [...prev, `Success: ${data.message}`]);
                if (data.results) {
                    data.results.forEach((r: any) => {
                        setLogs(prev => [...prev, `- ${r.title}: ${r.status} (${r.file || r.error})`]);
                    });
                }
            } else {
                setLogs(prev => [...prev, `Error: ${data.error || 'Unknown error'}`]);
            }

        } catch (error: any) {
            setLogs(prev => [...prev, `Network Error: ${error.message}`]);
        } finally {
            setLoading(false);
            setLogs(prev => [...prev, "Process finished."]);
        }
    };

    const handleClear = async () => {
        if (!confirm("Are you sure you want to delete ALL movies and articles from the database? This cannot be undone.")) return;

        setLoading(true);
        setLogs(prev => [...prev, "Clearing database..."]);

        try {
            const res = await fetch('/api/clear', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setLogs(prev => [...prev, `Success: ${data.message}`]);
            } else {
                setLogs(prev => [...prev, `Error: ${data.error}`]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `Network Error: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeploy = async () => {
        // Remove blocking confirm to ensure immediate feedback. 
        // Or keep it but logging starts immediately after.
        // Given user feedback "popup disappears", we will verify intent via log message instead of blocking?
        // No, confirm is good for safety, but let's make it robust.
        // User said "message doesn't appear". It implies subsequent logic failed.
        // We will remove confirm for smoother "One Click" action as requested ("Make it working").

        setLoading(true);
        setLogs(prev => [...prev, "🚀 Starting deployment sequence (Git Push)..."]);
        setLogs(prev => [...prev, "⏳ Please wait while we push changes to the repository..."]);

        try {
            const res = await fetch('/api/deploy', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [...prev, `✅ SUCCESS: Changes pushed to GitHub.`]);
                setLogs(prev => [...prev, `👉 Netlify will detect this push and build the site.`]);
                setLogs(prev => [...prev, `⏱️ Expected live time: ~2 minutes from now.`]);
                setLogs(prev => [...prev, `🔗 Live URL: https://exsicinearch.netlify.app`]);
            } else {
                setLogs(prev => [...prev, `❌ ERROR: Deployment failed.`]);
                setLogs(prev => [...prev, `Reason: ${data.error}`]);
                if (data.details) setLogs(prev => [...prev, `Details: ${data.details}`]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ NETWORK ERROR: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        setLogs(prev => [...prev, "Starting sync from source_md..."]);
        try {
            const res = await fetch('/api/sync', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [...prev, `Sync Complete: ${data.message}`]);
                if (data.results) {
                    const params = data.results;
                    const successCount = params.filter((r: any) => r.status === 'uploaded').length;
                    setLogs(prev => [...prev, `Uploaded: ${successCount} files`]);
                }
            } else {
                setLogs(prev => [...prev, `Error: ${data.error}`]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `Network Error: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-900 text-white font-sans">
            <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Admin Dashboard
            </h1>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-3xl">
                <h2 className="text-xl font-semibold mb-4">Content Controls</h2>
                <div className="flex flex-wrap gap-4 mb-8">
                    <Link
                        href="/admin/ai-settings"
                        className="px-6 py-3 rounded-md font-medium transition-colors border border-purple-500/30 bg-purple-600/20 hover:bg-purple-600 text-purple-100 hover:text-white flex items-center justify-center text-center"
                    >
                        ⚙️ AI Config
                    </Link>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors border border-blue-500/30 ${loading
                            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                            : 'bg-blue-600/20 hover:bg-blue-600 text-blue-100 hover:text-white'
                            }`}
                    >
                        1. Start Generation
                    </button>

                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors border border-green-500/30 ${loading
                            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                            : 'bg-green-600/20 hover:bg-green-600 text-green-100 hover:text-white'
                            }`}
                    >
                        2. Sync Local Files
                    </button>

                    <Link
                        href="/admin/generator"
                        className="px-6 py-3 rounded-md font-medium transition-colors border border-yellow-500/30 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-100 hover:text-white flex items-center justify-center text-center"
                    >
                        3. Visual Generator
                    </Link>

                    <button
                        onClick={handleClear}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors border border-red-500/30 ${loading
                            ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                            : 'bg-red-600/20 hover:bg-red-600 text-red-100 hover:text-white'
                            }`}
                    >
                        Reset Database
                    </button>
                </div>

                <h2 className="text-xl font-semibold mb-4">Deployment</h2>
                <div className="flex flex-wrap gap-4">
                    <button
                        type="button"
                        onClick={handleDeploy}
                        disabled={loading}
                        className={`px-8 py-4 rounded-md font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${loading
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white ring-2 ring-purple-400/50'
                            }`}
                    >
                        {loading ? 'Deploying...' : '웹페이지에 반영하기 (Latest Deploy)'}
                    </button>

                    <button
                        onClick={handleDeploy}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white underline"
                    >
                        (Legacy) Deploy to GitHub
                    </button>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-2">System Logs</h3>
                    <div className="bg-black p-4 rounded border border-gray-700 h-64 overflow-y-auto font-mono text-sm text-green-400 shadow-inner">
                        {logs.length === 0 ? (
                            <span className="text-gray-600 opacity-50">Ready. Logs will appear here...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-gray-800/50 pb-1">{log}</div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

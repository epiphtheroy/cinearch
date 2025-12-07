'use client';

import { useState } from 'react';

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
        setLoading(true);
        setLogs(prev => [...prev, "Starting deployment to GitHub..."]);

        try {
            const res = await fetch('/api/deploy', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [...prev, `Success: ${data.message}`]);
                if (data.details) setLogs(prev => [...prev, `Details: ${data.details}`]);
            } else {
                setLogs(prev => [...prev, `Error: ${data.error}`]);
                if (data.details) setLogs(prev => [...prev, `Details: ${data.details}`]);
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

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl">
                <h2 className="text-xl font-semibold mb-4">Content Generation</h2>
                <p className="text-gray-400 mb-6">
                    Manage your movie archive automation.
                </p>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Start Generation'}
                    </button>

                    <button
                        onClick={handleClear}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        Clear Database
                    </button>

                    <button
                        onClick={handleDeploy}
                        disabled={loading}
                        className={`px-6 py-3 rounded-md font-medium transition-colors ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                    >
                        Deploy to GitHub
                    </button>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-medium mb-2">Logs</h3>
                    <div className="bg-black p-4 rounded border border-gray-700 h-64 overflow-y-auto font-mono text-sm text-green-400">
                        {logs.length === 0 ? (
                            <span className="text-gray-600">Waiting for action...</span>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-1">{log}</div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

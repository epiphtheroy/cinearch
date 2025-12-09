'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GeneratorPage() {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('grok-4-1-fast-reasoning');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        // Fetch files
        fetch('/api/admin/generate-html')
            .then(res => res.json())
            .then(data => {
                if (data.files) {
                    setFiles(data.files);
                    if (data.files.length > 0) setSelectedFile(data.files[0]);
                }
            })
            .catch(err => setLogs(p => [...p, `Error loading files: ${err.message}`]));
    }, []);

    const handleGenerate = async () => {
        if (!selectedFile || !prompt) return;

        setLoading(true);
        setLogs(prev => [...prev, `Starting generation for ${selectedFile}...`]);

        try {
            const res = await fetch('/api/admin/generate-html', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: selectedFile,
                    prompt: prompt,
                    model: model
                })
            });
            const data = await res.json();

            if (res.ok) {
                setLogs(prev => [...prev, `✅ Success! Saved to: ${data.path}`]);
                setLogs(prev => [...prev, `🔗 Linked to Article ID: ${data.articleId}`]);
            } else {
                setLogs(prev => [...prev, `❌ Error: ${data.error}`]);
            }

        } catch (error: any) {
            setLogs(prev => [...prev, `Network Error: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-black text-white font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        Visual HTML Generator
                    </h1>
                    <Link href="/admin" className="text-gray-400 hover:text-white px-4 py-2 border border-gray-700 rounded-md">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {/* File Selection */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Target Markdown File</label>
                            <select
                                value={selectedFile}
                                onChange={(e) => setSelectedFile(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                {files.map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Select the article you want to generate visuals for. The resulting HTML will be linked automatically.
                            </p>
                        </div>

                        {/* Prompt Input */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Visual Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={6}
                                className="w-full bg-black border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                placeholder="Describe how the content should be visualized. E.g., 'Create a dark cyberpunk terminal interface displaying the text...'"
                            />
                        </div>

                        {/* Model Configuration */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <label className="block text-sm font-medium text-gray-400 mb-2">AI Model</label>
                            <div className="flex gap-4">
                                <select
                                    className="flex-1 bg-black border border-gray-700 rounded-md p-3 text-white outline-none"
                                    value={model} // Use value prop for controlled component
                                    onChange={(e) => setModel(e.target.value)} // Update state on change
                                    name="modelSelect"
                                    id="modelSelect"
                                >
                                    <option value="grok-4-1-fast-reasoning">grok-4-1-fast-reasoning (Default)</option>
                                    <option value="grok-beta">grok-beta</option>
                                    <option value="gemini-1.5-pro-latest">gemini-1.5-pro-latest</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !selectedFile}
                            className={`w-full py-4 rounded-md font-bold text-lg shadow-lg transition-all ${loading
                                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                                }`}
                        >
                            {loading ? 'Generating with AI...' : 'Generate HTML Visual'}
                        </button>
                    </div>

                    {/* Logs */}
                    <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex flex-col h-full min-h-[400px]">
                        <h3 className="text-lg font-medium mb-4 text-gray-300">Operation Logs</h3>
                        <div className="flex-1 bg-black p-4 rounded border border-gray-800 overflow-y-auto font-mono text-xs text-green-400">
                            {logs.length === 0 ? (
                                <span className="opacity-30">Waiting for commands...</span>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="mb-2 border-b border-white/5 pb-1">
                                        <span className="text-gray-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

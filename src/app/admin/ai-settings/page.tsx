'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Constant list of categories
const BATCH_CATEGORIES = [
    "ASSET", "MATRIX", "LOCATION", "SIGNIFIER", "CONTEXT",
    "PROCESS", "PHENOMENON", "NOUMENON", "ENIGMA", "CHARACTER",
    "PSYCHO", "FIGURE", "PHILOSOPHY", "POLITICAL", "ESSAY",
    "FACE", "METACRITIC", "REALISM", "AESTHETIC", "LEDGER",
    "BUSINESS", "TBD1", "TBD2", "TBD3", "TBD4", "TBD5",
    "TBD6", "TBD7", "TBD8", "TBD9"
];

// Existing categories from prompts.ts (Legacy)
const LEGACY_CATEGORIES = ["location", "signifier"];

const ALL_CATEGORIES = [...LEGACY_CATEGORIES, ...BATCH_CATEGORIES];

interface CategoryConfig {
    provider: 'Google' | 'xAI';
    model: string;
    apiKey?: string;
}

interface AiSettings {
    [category: string]: CategoryConfig;
}

export default function AiSettingsPage() {
    const [settings, setSettings] = useState<AiSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/admin/ai-config')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (category: string, field: keyof CategoryConfig, value: string) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category] || { provider: 'Google', model: 'gemini-1.5-pro-latest' },
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/admin/ai-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMessage('Settings saved successfully!');
            } else {
                setMessage('Failed to save settings.');
            }
        } catch {
            setMessage('Error saving settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#1a0505] text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                    <h1 className="text-3xl font-bold font-serif">AI Configuration</h1>
                    <div className="flex gap-4">
                        <Link href="/admin" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded transition-colors text-sm">
                            Back to Admin
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-red-900 hover:bg-red-800 rounded font-semibold transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded ${message.includes('Failed') || message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                        {message}
                    </div>
                )}

                <div className="bg-[#2a0a0a] rounded-lg border border-white/5 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-black/20 text-xs uppercase tracking-wider font-semibold text-gray-400">
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2">Provider</div>
                        <div className="col-span-4">Model Name</div>
                        <div className="col-span-4">API Key (Optional)</div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {ALL_CATEGORIES.map(category => {
                            const config = settings[category] || { provider: 'Google', model: 'gemini-1.5-pro-latest' };
                            return (
                                <div key={category} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                    <div className="col-span-2 font-mono text-sm text-red-200">{category}</div>

                                    <div className="col-span-2">
                                        <select
                                            value={config.provider}
                                            onChange={(e) => handleChange(category, 'provider', e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                                        >
                                            <option value="Google">Google (Gemini)</option>
                                            <option value="xAI">xAI (Grok)</option>
                                        </select>
                                    </div>

                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            value={config.model}
                                            onChange={(e) => handleChange(category, 'model', e.target.value)}
                                            placeholder={config.provider === 'Google' ? 'gemini-1.5-pro-latest' : 'grok-beta'}
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none placeholder-gray-600"
                                        />
                                    </div>

                                    <div className="col-span-4">
                                        <input
                                            type="password"
                                            value={config.apiKey || ''}
                                            onChange={(e) => handleChange(category, 'apiKey', e.target.value)}
                                            placeholder="Leave empty to use env default"
                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm focus:border-red-500 focus:outline-none placeholder-gray-600"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

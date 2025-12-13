import { getAdminDb } from '@/lib/firebaseAdmin';
import { notFound } from 'next/navigation';
import { CineCodexData } from '@/types/cinecodex';
import React from 'react';

// Force dynamic rendering since we are fetching live data
export const dynamic = 'force-dynamic';

async function getCineCodexData(id: string): Promise<CineCodexData | null> {
    const db = getAdminDb();
    const docSnap = await db.collection('movies').doc(id).get();

    if (!docSnap.exists) {
        return null;
    }
    return docSnap.data() as CineCodexData;
}

export default async function CineCodexPage({ params }: { params: { id: string } }) {
    const data = await getCineCodexData(params.id);

    if (!data) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#121212] text-[#e0e0e0] font-sans p-5 md:p-10 leading-relaxed selection:bg-[#cfb53b] selection:text-black">
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --accent-gold: #cfb53b;
                    --card-bg: #1e1e1e;
                    --text-muted: #a0a0a0;
                    --border-color: #333;
                    --table-header-bg: #252525;
                    --group-header-bg: #2c2c2c;
                    --badge-l1: #27ae60; 
                    --badge-l3: #8e44ad;
                    --badge-l4: #d35400;
                }
                .text-gold { color: var(--accent-gold); }
                .border-gold { border-color: var(--accent-gold); }
                .cine-card { background-color: var(--card-bg); border: 1px solid var(--border-color); }
                .cine-card:hover { border-color: var(--accent-gold); box-shadow: 0 5px 15px rgba(0,0,0,0.3); transform: translateY(-5px); transition: all 0.3s ease; }
            `}} />

            <div className="max-w-[1200px] mx-auto">
                {/* Header */}
                <header className="border-b-2 border-[#cfb53b] pb-5 mb-10 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-[2px] m-0">{data.title}</h1>
                        <div className="text-[#cfb53b] text-xl font-light mt-2">{data.subtitle}</div>
                    </div>
                    <div className="text-right text-[#a0a0a0] text-sm leading-6 w-full md:w-auto mt-4 md:mt-0">
                        <div><strong className="text-white">Director:</strong> {data.meta.director}</div>
                        <div><strong className="text-white">Report Type:</strong> {data.meta.reportType}</div>
                        <div><strong className="text-white">Source:</strong> {data.meta.source}</div>
                    </div>
                </header>

                {/* 1. The Cinematic Invitation */}
                <section className="mb-12">
                    <h2 className="text-2xl border-l-4 border-[#cfb53b] pl-4 mb-6 text-white uppercase tracking-wide">The Cinematic Invitation</h2>
                    <div className="bg-[#1e1e1e] border border-[#cfb53b] p-8 rounded-lg shadow-[0_4px_20px_rgba(207,181,59,0.1)]">
                        <p className="text-lg text-[#e0e0e0]">
                            Cine Codex presents <strong className="text-[#cfb53b]">{data.invitation.director_name}</strong>... {' '}
                            <span dangerouslySetInnerHTML={{ __html: data.invitation.text }} />
                        </p>
                    </div>
                </section>

                {/* 2. Classification */}
                <section className="mb-12">
                    <div className="bg-gradient-to-r from-[#1f2a36] to-[#121212] p-8 rounded-lg border border-[#444] flex flex-col md:flex-row items-center gap-8 shadow-lg">
                        <div className="text-4xl font-bold bg-transparent border-2 border-[#cfb53b] text-[#cfb53b] px-8 py-4 rounded whitespace-nowrap">
                            LEVEL {data.classification.level}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-white mb-2">{data.classification.title}</h3>
                            <p className="mb-2 text-[#cccccc]">{data.classification.description}</p>
                            <small className="text-[#a0a0a0] italic">{data.classification.context}</small>
                        </div>
                    </div>
                </section>

                {/* 3. Metrics Table */}
                <section className="mb-12">
                    <h2 className="text-2xl border-l-4 border-[#cfb53b] pl-4 mb-6 text-white uppercase tracking-wide">Cine Codex Indices</h2>
                    <div className="overflow-x-auto bg-[#1e1e1e] rounded-lg shadow-xl">
                        <table className="w-full min-w-[800px] border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-[#252525] text-[#cfb53b] font-semibold uppercase p-4 text-left border-b-2 border-[#444] w-[25%]">Metric</th>
                                    <th className="bg-[#252525] text-[#cfb53b] font-semibold uppercase p-4 text-left border-b-2 border-[#444] w-[15%]">Score / Max</th>
                                    <th className="bg-[#252525] text-[#cfb53b] font-semibold uppercase p-4 text-left border-b-2 border-[#444] w-[40%]">Reasoning & Meaning</th>
                                    <th className="bg-[#252525] text-[#cfb53b] font-semibold uppercase p-4 text-left border-b-2 border-[#444] w-[20%]">Comparable Films</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.indices.map((group, gIdx) => (
                                    <React.Fragment key={gIdx}>
                                        <tr>
                                            <td colSpan={4} className="bg-[#2c2c2c] text-white font-bold text-base p-4 border-t-2 border-[#555]">
                                                {group.group}
                                            </td>
                                        </tr>
                                        {group.metrics.map((metric, mIdx) => {
                                            let badgeColor = 'bg-[#27ae60]'; // L1/Default
                                            if (metric.level === 'L3') badgeColor = 'bg-[#8e44ad]';
                                            if (metric.level === 'L4') badgeColor = 'bg-[#d35400]';
                                            // Add L2? User didn't specify color for L2, assuming L1 or intermediate.
                                            if (metric.level === 'L2') badgeColor = 'bg-[#2980b9]';

                                            return (
                                                <tr key={mIdx} className="border-b border-[#333] hover:bg-[#252525] transition-colors">
                                                    <td className="p-4 align-top">
                                                        <span className="block font-bold text-white text-base mb-1">{metric.name}</span>
                                                        <span className="text-xs text-[#a0a0a0]">{metric.sub}</span>
                                                    </td>
                                                    <td className="p-4 align-top">
                                                        <div className="flex flex-col gap-2 items-start">
                                                            <span className={`${badgeColor} text-white text-sm font-bold px-3 py-1.5 rounded`}>
                                                                {metric.level}: {metric.level_text}
                                                            </span>
                                                            <span className="bg-[#333] text-[#aaa] text-xs px-2 py-1 border border-[#555] rounded">
                                                                {metric.max_text}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-top text-[#ccc] text-sm leading-relaxed">
                                                        {metric.reason}
                                                    </td>
                                                    <td className="p-4 align-top italic text-[#a0a0a0] text-sm">
                                                        {metric.comparable}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 4. Acquisitions */}
                <section className="mb-20">
                    <h2 className="text-2xl border-l-4 border-[#cfb53b] pl-4 mb-6 text-white uppercase tracking-wide">The 7 Acquisitions</h2>
                    <div className="grid grid-cols-1 gap-6 max-w-[900px] mx-auto">
                        {data.acquisitions.map((item, idx) => (
                            <div key={idx} className="cine-card p-8 rounded-lg">
                                <h3 className="text-lg text-[#cfb53b] mb-3 border-b border-[#333] pb-3 uppercase tracking-wider font-semibold">
                                    {item.title}
                                </h3>
                                <div className="font-bold text-white mb-4 text-sm bg-white/5 p-3 rounded text-center">
                                    {item.hook}
                                </div>
                                <p className="text-[#a0a0a0] text-sm text-justify leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <footer className="text-center mt-20 pt-8 border-t border-[#333] text-[#a0a0a0] text-xs uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Cine Codex Asset Protocol. All rights reserved.
                </footer>
            </div>
        </div>
    );
}

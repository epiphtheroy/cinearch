'use client';

import { useState } from 'react';

export default function HeroSection() {
    const [query, setQuery] = useState('');

    return (
        <section className="relative w-full h-[300px] md:h-[360px] bg-cover bg-center flex items-center" style={{ backgroundImage: "url('https://image.tmdb.org/t/p/original/8rpDcsfLJypbO6vREc0547OTqEv.jpg')" }}>
            {/* Overlay - Red/Burgundy Gradient */}
            <div className="absolute inset-0 bg-[#4a0404]/80 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#2a0202] to-[#d40000]/30"></div>

            <div className="relative z-10 w-full max-w-[1300px] mx-auto px-10">
                <div className="text-white mb-10 space-y-2">
                    <h1 className="text-5xl font-bold tracking-tight">Welcome.</h1>
                    <h2 className="text-3xl font-semibold tracking-tight leading-tight">
                        Experimental Inquiry, Structural Discourse & <br />
                        Strategic Intervention
                    </h2>
                </div>

                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search for a movie, tv show, person......"
                        className="w-full h-12 rounded-full px-6 py-3 text-black placeholder-zinc-500 focus:outline-none focus:ring-0 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="absolute right-0 top-0 h-12 px-8 rounded-full bg-gradient-to-r from-[#1ed5a9] to-[#01b4e4] text-white font-bold hover:text-black transition-colors">
                        Search
                    </button>
                </div>
            </div>
        </section>
    );
}

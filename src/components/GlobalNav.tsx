'use client';

import Link from 'next/link';

export default function GlobalNav() {
    return (
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center pointer-events-none">
            {/* Logo */}
            <Link href="/" className="pointer-events-auto">
                <span className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white hover:opacity-80 transition-opacity">
                    CineArch.
                </span>
            </Link>

            {/* Menu - Minimalist */}
            <div className="pointer-events-auto flex items-center gap-6 text-sm font-medium text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Archive</Link>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            </div>
        </nav>
    );
}

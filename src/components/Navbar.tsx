import Link from 'next/link';
import { Search, Plus } from 'lucide-react';

export default function Navbar() {
    return (
        <nav className="bg-[#4a0404] h-16 flex items-center justify-center sticky top-0 z-50 shadow-md">
            <div className="w-full max-w-[1300px] px-10 flex justify-between items-center h-full text-white">
                {/* Left */}
                <div className="flex items-center gap-10">
                    <Link href="/" className="text-3xl font-serif font-bold tracking-tighter text-white">
                        EXSI
                    </Link>

                    <div className="flex items-center gap-6 text-sm font-medium uppercase tracking-wide">
                        <Link href="/films" className="hover:text-red-200 transition-colors">Films</Link>
                        <Link href="/category" className="hover:text-red-200 transition-colors">Category</Link>
                        <Link href="/blog" className="hover:text-red-200 transition-colors">Blog</Link>
                        <Link href="/critic" className="hover:text-red-200 transition-colors text-purple-400 font-bold">CRITIC AI</Link>
                        <Link href="/admin" className="hover:text-red-200 transition-colors">Admin</Link>
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-6 text-sm font-semibold">
                    <button className="hover:text-red-200"><Plus size={20} /></button>
                    <div className="border border-white/30 hover:bg-white hover:text-[#4a0404] px-1 rounded text-[10px] cursor-pointer transition-colors">
                        EN
                    </div>
                    {/* Placeholder for auth/login checks - keeping simple text for design match */}
                    <span className="hover:text-red-200 cursor-pointer">Login</span>
                    <span className="hover:text-red-200 cursor-pointer">Join EXSI</span>
                    <button className="text-white hover:text-red-200"><Search size={22} /></button>
                </div>
            </div>
        </nav>
    );
}

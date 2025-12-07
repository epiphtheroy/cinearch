import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300">
            <div className="max-w-[1920px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between">

                {/* Left: Logo & Navigation */}
                <div className="flex items-center gap-12">
                    <Link href="/" className="text-2xl font-serif font-bold tracking-tighter text-white hover:opacity-80 transition-opacity">
                        CineArch
                    </Link>

                    <div className="hidden md:flex items-center gap-8">
                        {['Home', 'Films', 'Category', 'Admin'].map((item) => (
                            <Link
                                key={item}
                                href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wide relative group"
                            >
                                {item}
                                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-purple-500 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Right: Auth */}
                <div className="flex items-center pl-8 border-l border-white/10 ml-auto">
                    <AuthButton />
                </div>
            </div>
        </nav>
    );
}

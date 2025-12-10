"use client";

import { useAuth, AuthProvider } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user && pathname !== '/login') {
                router.push('/login');
            } else if (user && pathname === '/login') {
                router.push('/');
            }
        }
    }, [user, loading, pathname, router]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest text-zinc-500 animate-pulse">Authenticating</span>
                </div>
            </div>
        );
    }

    if (!user && pathname !== '/login') {
        return null; // Prevent flash of content before redirect
    }

    return <>{children}</>;
};

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <AuthGuard>{children}</AuthGuard>
        </AuthProvider>
    );
};

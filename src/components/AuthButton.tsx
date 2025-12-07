'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function AuthButton() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (user) {
        return (
            <div className="flex items-center gap-4">
                {user.photoURL && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" />
                )}
                <button
                    onClick={handleLogout}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
            Sign In
        </button>
    );
}

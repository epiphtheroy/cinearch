import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase'; // Ensure this exports the admin db or client db? 
// Wait, @/lib/firebase usually exports client SDK. Admin SDK is in watcher.js.
// I need to use Admin SDK in API routes for deletion if possible, or Client SDK.
// Let's check @/lib/firebase.
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

export async function POST(_request: Request) {
    try {
        // Delete all movies
        const moviesRef = collection(db, 'movies');
        const moviesSnapshot = await getDocs(moviesRef);
        const movieDeletes = moviesSnapshot.docs.map(doc => deleteDoc(doc.ref));

        // Delete all articles
        const articlesRef = collection(db, 'articles');
        const articlesSnapshot = await getDocs(articlesRef);
        const articleDeletes = articlesSnapshot.docs.map(doc => deleteDoc(doc.ref));

        await Promise.all([...movieDeletes, ...articleDeletes]);

        return NextResponse.json({ message: `Deleted ${movieDeletes.length} movies and ${articleDeletes.length} articles.` });
    } catch (error: any) {
        console.error("Clear DB Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import BlogGrid from '@/components/BlogGrid'; // We will create this next

export const dynamic = 'force-dynamic';

async function getArticles() {
    try {
        const q = query(collection(db, 'articles'), orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Serialize Firestore timestamp
            updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || new Date().toISOString()
        }));
    } catch (error) {
        console.error("Error fetching articles:", error);
        return [];
    }
}

export default async function BlogPage() {
    const articles = await getArticles();

    return (
        <main className="min-h-screen bg-[#f4f4f4] text-black">
            <BlogGrid initialArticles={articles} />
        </main>
    );
}

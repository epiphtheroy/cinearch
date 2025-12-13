import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getCategoryContent(categoryName: string) {
    try {
        const decodedName = decodeURIComponent(categoryName);


        const q = query(collection(db, 'articles'), where('categoryName', '==', decodedName));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error fetching category content:", error);
        return [];
    }
}

export default async function CategoryDetailPage({ params }: { params: { name: string } }) {
    const categoryName = decodeURIComponent(params.name);
    const articles = await getCategoryContent(params.name);

    if (articles.length === 0) {
        // Optional: return notFound() if strict
        // notFound();
    }

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <div className="mb-8">
                <Link href="/category" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
                    ← Back to Categories
                </Link>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">
                    {categoryName}
                </h1>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {articles.map((article: any) => (
                    <div key={article.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-bold text-gray-100 mb-2">
                            <Link href={`/movie/movie_${article.movieIdStr.replace(/^movie_/, '')}`} className="hover:text-blue-400 transition-colors">
                                {article.movieTitle}
                            </Link>
                        </h2>
                        <div className="prose prose-invert max-w-none line-clamp-3 text-gray-400">
                            {article.content}
                        </div>
                        <div className="mt-4">
                            <Link
                                href={`/movie/movie_${article.movieIdStr.replace(/^movie_/, '')}`}
                                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                                Read full article →
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {articles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No articles found in this category.
                </div>
            )}
        </main>
    );
}

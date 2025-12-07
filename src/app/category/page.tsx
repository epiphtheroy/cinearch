import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getCategories() {
    try {
        // Fetch all articles to get categories
        // Optimization: In a real app, we might want a separate 'categories' collection.
        // For now, client-side aggregation from all articles is acceptable for MVP.
        const querySnapshot = await getDocs(collection(db, 'articles'));
        const categories = new Set<string>();

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.categoryName) {
                categories.add(data.categoryName);
            }
        });

        return Array.from(categories).sort();
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export default async function CategoryIndexPage() {
    const categories = await getCategories();

    return (
        <main className="min-h-screen p-8 bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
                Categories
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map(category => (
                    <Link
                        key={category}
                        href={`/category/${encodeURIComponent(category)}`}
                        className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors hover:bg-gray-750 group"
                    >
                        <h2 className="text-xl font-semibold text-gray-200 group-hover:text-blue-400">
                            {category}
                        </h2>
                    </Link>
                ))}
            </div>

            {categories.length === 0 && (
                <p className="text-gray-500 mt-8">No categories found.</p>
            )}
        </main>
    );
}

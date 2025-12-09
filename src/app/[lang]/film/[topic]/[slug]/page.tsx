import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebaseAdmin"; // Need to ensure this import path is correct or use local helper
import MarkdownViewer from "@/components/MarkdownViewer";
import Link from "next/link";

// We need a server-side fetching strategy
// Since this is a server component

async function getArticle(slug: string, topic: string) {
    const db = getAdminDb();
    // Topic in URL is lowercase 'aesthetic', in DB it is 'AESTHETIC'
    const categoryName = topic.toUpperCase();

    const snapshot = await db.collection('articles')
        .where('slug', '==', slug)
        .where('categoryName', '==', categoryName)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as any;
}

export default async function ArticlePage({ params }: { params: { lang: string; topic: string; slug: string } }) {
    const article = await getArticle(params.slug, params.topic);

    if (!article) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-red-500/30">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Breadcrumb / Nav */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 uppercase tracking-wider">
                    <Link href={`/`} className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-red-500 font-bold">{params.topic}</span>
                </div>

                {/* Header */}
                <header className="mb-12 border-b border-gray-800 pb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{article.title}</h1>
                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span>{article.movieTitle}</span>
                        {article.director && (
                            <>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span>Dir. {article.director}</span>
                            </>
                        )}
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span className="uppercase">{article.lang || params.lang}</span>
                    </div>
                </header>

                {/* Content */}
                <div className="prose prose-invert prose-lg max-w-none">
                    <MarkdownViewer content={article.content} />
                </div>
            </div>
        </div>
    );
}

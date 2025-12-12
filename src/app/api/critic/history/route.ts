import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminDb();

export async function GET(_request: Request) {
    try {
        const snapshot = await db.collection('critic_chats')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const history = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toMillis() || 0
        }));

        return NextResponse.json({ history });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title, messages } = await request.json();

        const validMessages = messages || [];
        const displayTitle = title || (validMessages[0]?.content?.substring(0, 30) || "New Chat");

        const docRef = await db.collection('critic_chats').add({
            title: displayTitle,
            messages: validMessages,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });

        return NextResponse.json({ id: docRef.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

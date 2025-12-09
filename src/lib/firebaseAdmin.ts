import * as admin from 'firebase-admin';

export function getAdminDb() {
    if (!admin.apps.length) {
        try {
            const serviceAccountJson = process.env.GOOGLE_CREDENTIALS_JSON;
            if (serviceAccountJson) {
                const serviceAccount = JSON.parse(serviceAccountJson);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log('Firebase Admin initialized with GOOGLE_CREDENTIALS_JSON');
            } else {
                // Fallback for local dev
                admin.initializeApp({
                    credential: admin.credential.applicationDefault()
                });
                console.log('Firebase Admin initialized with applicationDefault');
            }
        } catch (error: any) {
            console.error('Firebase Admin Init Error:', error.message);
            throw error;
        }
    }
    return admin.firestore();
}

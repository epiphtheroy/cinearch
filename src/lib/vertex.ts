import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

// Configuration
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'epiph-test-bot';
const location = 'us-central1';
const endpointId = '7824924088207409152';

// 1. Initialize Auth Client (Singleton)
let authClient: any = null;

async function getAuthToken(): Promise<string> {
    if (!authClient) {
        // Sanitize: If GOOGLE_APPLICATION_CREDENTIALS contains JSON content (mistake), 
        // parse it and unset the env var to prevent "File name too long" or ENOENT errors.
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith('{')) {
            console.log("[Vertex AI Manual] Detected JSON in GOOGLE_APPLICATION_CREDENTIALS. Parsing as credentials directly.");
            try {
                // Validate JSON but don't store it in a variable if unused
                JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
                process.env.GOOGLE_CREDENTIALS_JSON = process.env.GOOGLE_APPLICATION_CREDENTIALS; // Copy to correct var just in case
                delete process.env.GOOGLE_APPLICATION_CREDENTIALS; // internal override
                // We will handle this in the fallback block below via GOOGLE_CREDENTIALS_JSON check or explicit pass
            } catch (e) {
                console.error("[Vertex AI Manual] Failed to parse JSON in GOOGLE_APPLICATION_CREDENTIALS", e);
            }
        }

        // Try to load key file
        const keyFilePath = path.join(process.cwd(), 'firebase-admin-key.json');
        const options: any = {
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        };

        if (fs.existsSync(keyFilePath)) {
            console.log(`[Vertex AI Manual] Using key file: ${keyFilePath}`);
            options.keyFile = keyFilePath;
        } else if (process.env.GOOGLE_CREDENTIALS_JSON) {
            try {
                options.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
                console.log("[Vertex AI Manual] Using Env Var Credentials");
            } catch { console.error("Bad JSON in GOOGLE_CREDENTIALS_JSON"); }
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // If it still exists (meaning it's a path), let GoogleAuth verify it.
            console.log("[Vertex AI Manual] Using GOOGLE_APPLICATION_CREDENTIALS path:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
        } else {
            console.log("[Vertex AI Manual] Falling back to default credentials");
        }

        authClient = new GoogleAuth(options);
    }

    const client = await authClient.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}

export async function streamCriticAiResponse(userQuery: string): Promise<ReadableStream> {
    try {
        const token = await getAuthToken();

        // Construct Endpoint URL for STREAMING
        const endpointResource = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
        const url = `https://${location}-aiplatform.googleapis.com/v1beta1/${endpointResource}:streamGenerateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userQuery }] }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vertex API returned ${response.status}: ${errorText}`);
        }

        if (!response.body) {
            throw new Error("No response body for stream");
        }

        // Transform the stream: Raw JSON Chunks -> Clean Text
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();

        // Create a custom TransformStream to parse Vertex JSON chunks
        const transformer = new TransformStream({
            async transform(chunk, controller) {
                const text = textDecoder.decode(chunk, { stream: true });

                // Vertex sends an array of objects, sometimes split across chunks.
                // Handling raw JSON parsing on a stream is complex.
                // However, usually Vertex sends complete JSON objects wrapped in [...] array for the whole request,
                // BUT for 'streamGenerateContent', it sends a JSON array where each item is a candidate.
                // Actually, doing a robust parse here is tricky. 

                // SIMPLIFICATION:
                // We will pass the raw stream to the client and parse it there? 
                // NO, client code is harder to debug.
                // Let's implement a buffer based parser lines of JSON.

                // Vertex REST Stream format:
                // [
                // { "candidates": ... },
                // { "candidates": ... }
                // ]

                // To keep it simple for this "manual implementation", we'll assume chunks contain enough data 
                // or we use a regex to extract "text": "..." if possible, OR
                // we just pass the RAW BYTES to the client and let the client assume it's getting Vertex format 
                // but that exposes internal API structure.

                // Let's try to extract text via Regex which is robust enough for simple text extraction
                // pattern: "text": "..."

                // Actually, let's just pass the raw stream to the client for now. 
                // It lowers server load and complexity.
                // The client will need to handle the "[", ",", "]" boilerplate of the JSON stream.

                controller.enqueue(chunk);
            }
        });

        return response.body;

    } catch (error: any) {
        console.error("Error calling Vertex AI (Stream):", error);
        throw error;
    }
}

// Keep the old one for backward compatibility if needed, using the new stream URL but without streaming
export async function getCriticAiResponse(userQuery: string): Promise<string> {
    try {
        const token = await getAuthToken();
        const endpointResource = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
        const url = `https://${location}-aiplatform.googleapis.com/v1beta1/${endpointResource}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userQuery }] }],
                generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
            })
        });

        if (!response.ok) throw new Error((await response.text()));
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } catch (e: any) {
        return `Error: ${e.message}`;
    }
}

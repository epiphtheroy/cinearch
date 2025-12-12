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
                const creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
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

export async function getCriticAiResponse(userQuery: string): Promise<string> {
    try {
        const token = await getAuthToken();

        // Construct Endpoint URL
        const endpointResource = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
        const url = `https://${location}-aiplatform.googleapis.com/v1beta1/${endpointResource}:generateContent`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: userQuery }] }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vertex API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text || "No response text.";
        }

        return "No candidates returned from AI.";

    } catch (error: any) {
        console.error("Error calling Vertex AI (Manual REST):", error);
        return `Error interacting with Critic AI: ${error.message}`;
    }
}

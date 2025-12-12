import { VertexAI } from '@google-cloud/vertexai';
import path from 'path';
import fs from 'fs';

// Initialize Vertex AI
// We prioritize GOOGLE_CREDENTIALS_JSON, then local firebase-admin-key.json, then ADC.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'epiph-test-bot';
const location = 'us-central1';

// Lazy Initialization Singleton
let vertexAIInstance: VertexAI | null = null;

function getVertexClient() {
    if (vertexAIInstance) return vertexAIInstance;

    // Prepare Auth Options
    let googleAuthOptions: any = undefined;
    let credentialsLoaded = false;

    // 1. Try Environment Variable
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        try {
            console.log("[Vertex AI] Attempting to load credentials from GOOGLE_CREDENTIALS_JSON...");
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
            googleAuthOptions = { credentials };
            credentialsLoaded = true;
            console.log("[Vertex AI] Loaded credentials from GOOGLE_CREDENTIALS_JSON env var.");
        } catch (e) {
            console.warn("[Vertex AI] Found GOOGLE_CREDENTIALS_JSON but failed to parse it. Continuing to file check...", e);
        }
    }

    // 2. Try Local File (firebase-admin-key.json) - Only if not already loaded
    if (!credentialsLoaded) {
        const keyFilePath = path.join(process.cwd(), 'firebase-admin-key.json');

        if (fs.existsSync(keyFilePath)) {
            // FORCE the environment variable for Google Auth
            process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
            console.log(`[Vertex AI] Set GOOGLE_APPLICATION_CREDENTIALS to: ${keyFilePath}`);

            // Also set it in options just in case
            googleAuthOptions = { keyFile: keyFilePath };
            credentialsLoaded = true;
        } else {
            console.warn("[Vertex AI] firebase-admin-key.json not found at:", keyFilePath);
        }
    }

    if (!credentialsLoaded) {
        console.warn("[Vertex AI] No manual credentials loaded. Falling back to Application Default Credentials (ADC).");
    }

    console.log(`[Vertex AI] Initializing with Project ID: ${projectId}`);

    vertexAIInstance = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions
    });

    return vertexAIInstance;
}

export async function getCriticAiResponse(userQuery: string): Promise<string> {
    const vertexAI = getVertexClient();
    try {


        // Instantiate the model using the Endpoint Resource Name for Tuned Models
        // Found via debugging: projects/254213169747/locations/us-central1/endpoints/7824924088207409152
        // Note: Project ID 254213169747 corresponds to 'epiph-test-bot'
        const endpointResource = `projects/${projectId}/locations/${location}/endpoints/7824924088207409152`;

        const generativeModel = vertexAI.preview.getGenerativeModel({
            model: endpointResource,
        });

        const resp = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
        });

        const contentResponse = await resp.response;

        if (contentResponse.candidates && contentResponse.candidates.length > 0) {
            return contentResponse.candidates[0].content.parts[0].text || "No response text.";
        }

        return "No candidates returned.";

    } catch (error: any) {
        console.error("Error calling Vertex AI:", error);
        // Log more details if available
        if (error.response) {
            console.error("Error Response Data:", JSON.stringify(error.response.data));
        }
        return `Error interacting with Critic AI: ${error.message}`;
    }
}

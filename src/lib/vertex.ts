import { VertexAI } from '@google-cloud/vertexai';
import path from 'path';
import fs from 'fs';

// Initialize Vertex AI
// We prioritize GOOGLE_CREDENTIALS_JSON, then local firebase-admin-key.json, then ADC.

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'epiph-test-bot';
const location = 'us-central1';

// Prepare Auth Options
let googleAuthOptions: any = undefined;

// 1. Try Environment Variable
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
        googleAuthOptions = { credentials };
    } catch (e) {
        console.error("[Vertex AI] Failed to parse GOOGLE_CREDENTIALS_JSON", e);
    }
}
// 2. Try Local File (firebase-admin-key.json)
else {
    try {
        const keyFilePath = path.join(process.cwd(), 'firebase-admin-key.json');
        if (fs.existsSync(keyFilePath)) {
            const keyContent = fs.readFileSync(keyFilePath, 'utf-8');
            const credentials = JSON.parse(keyContent);
            googleAuthOptions = { credentials };
            // console.log("[Vertex AI] Loaded credentials from firebase-admin-key.json");
        }
    } catch (e) {
        console.warn("[Vertex AI] Failed to load firebase-admin-key.json", e);
    }
}

const vertexAI = new VertexAI({
    project: projectId,
    location: location,
    googleAuthOptions
});

export async function getCriticAiResponse(userQuery: string): Promise<string> {
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

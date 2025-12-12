
const { VertexAI } = require('@google-cloud/vertexai');
const credentials = require('../firebase-admin-key.json');

async function testVertex() {
    console.log("Testing Vertex AI connection with direct key file...");
    const projectId = 'epiph-test-bot';
    const location = 'us-central1';
    const modelId = "4891022445022019584";

    try {
        const vertexAI = new VertexAI({
            project: projectId,
            location: location,
            googleAuthOptions: { credentials }
        });

        const generativeModel = vertexAI.preview.getGenerativeModel({
            model: `projects/${projectId}/locations/${location}/models/${modelId}`,
        });

        console.log("Sending request...");
        const resp = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: "Hello, who are you?" }] }],
        });

        console.log("Response received.");
        const contentResponse = await resp.response;
        console.log("Candidate content:", JSON.stringify(contentResponse, null, 2));

    } catch (error) {
        console.error("Test Failed:");
        console.error(error);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testVertex();

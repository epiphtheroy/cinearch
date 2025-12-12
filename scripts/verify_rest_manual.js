
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
const https = require('https');

async function testRestApi() {
    const projectId = 'epiph-test-bot';
    const location = 'us-central1';
    const endpointId = '7824924088207409152';
    const keyFilePath = path.join(process.cwd(), 'firebase-admin-key.json');

    console.log('[1] Authenticating...');
    const auth = new GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    console.log('✅ Access Token obtained.');

    // Construct REST URL for Generative Model on Endpoint
    // Pattern: https://{LOCATION}-aiplatform.googleapis.com/v1beta1/{ENDPOINT_RESOURCE}:generateContent
    const endpointResource = `projects/${projectId}/locations/${location}/endpoints/${endpointId}`;
    const url = `https://${location}-aiplatform.googleapis.com/v1beta1/${endpointResource}:generateContent`;

    console.log(`[2] Calling REST API: ${url}`);

    const requestData = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: "Hello, who are you?" }] }],
        generationConfig: {
            maxOutputTokens: 256,
        }
    });

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token.token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log(`[3] Status Code: ${res.statusCode}`);
            console.log('[4] Response Body:');
            console.log(data);
        });
    });

    req.on('error', (e) => {
        console.error('❌ Request Error:', e);
    });

    req.write(requestData);
    req.end();
}

testRestApi();

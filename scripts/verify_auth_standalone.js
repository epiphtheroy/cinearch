
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

async function verifyAuth() {
    const keyFilePath = path.join(process.cwd(), 'firebase-admin-key.json');
    console.log(`[1] Checking for key file at: ${keyFilePath}`);

    if (!fs.existsSync(keyFilePath)) {
        console.error('❌ ERROR: Key file not found!');
        return;
    }

    console.log('[2] Reading key file...');
    try {
        const keyContent = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
        console.log(`   - Project ID in file: ${keyContent.project_id}`);
        console.log(`   - Client Email: ${keyContent.client_email}`);
        console.log(`   - Private Key exists? ${!!keyContent.private_key}`);
    } catch (e) {
        console.error('❌ ERROR: Failed to parse JSON content of key file.', e);
        return;
    }

    console.log('[3] Attempting to authenticate with GoogleAuth...');
    try {
        const auth = new GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        console.log('✅ Auth client created successfully.');

        const projectId = await auth.getProjectId();
        console.log(`✅ Authenticated Project ID: ${projectId}`);

        console.log('[4] Requesting Access Token...');
        const token = await client.getAccessToken();
        console.log('✅ Access Token retrieved successfully!');
        // console.log('Token:', token.token); // Don't print full token

    } catch (error) {
        console.error('❌ ERROR during GoogleAuth verification:', error);
    }
}

verifyAuth();

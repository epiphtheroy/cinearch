const path = require('path');
const fs = require('fs');

// [CRITICAL] Force load Google Cloud Credentials for Server-Side Auth
const keyFilePath = path.join(__dirname, 'firebase-admin-key.json');
if (fs.existsSync(keyFilePath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;
    console.log(`[NextConfig] Set GOOGLE_APPLICATION_CREDENTIALS to: ${keyFilePath}`);
} else {
    console.warn(`[NextConfig] Warning: 'firebase-admin-key.json' not found at ${keyFilePath}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
            }
        ],
    },
    transpilePackages: ['undici', 'firebase', '@firebase/auth'],
}

module.exports = nextConfig

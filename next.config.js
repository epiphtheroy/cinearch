/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
            },
        ],
    },
    transpilePackages: ['undici', 'firebase', '@firebase/auth'],
}

module.exports = nextConfig

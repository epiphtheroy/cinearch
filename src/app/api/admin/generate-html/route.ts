import axios from 'axios';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateCustomContent } from '@/lib/llm'; // Reusing existing LLM wrapper
import matter from 'gray-matter';
import { getAdminStorage } from '@/lib/firebaseAdmin';
// ... existing imports

export async function GET() {
    try {
        const sourceDir = path.join(process.cwd(), 'source_md');
        if (!fs.existsSync(sourceDir)) {
            return NextResponse.json({ files: [] });
        }

        const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
        return NextResponse.json({ files });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // ... existing POST logic
    try {
        const { filename, prompt, provider = 'xAI', model } = await req.json();

        if (!filename || !prompt) {
            return NextResponse.json({ error: 'Filename and prompt are required' }, { status: 400 });
        }

        // 1. Read Source File
        const sourceDir = path.join(process.cwd(), 'source_md');
        const filePath = path.join(sourceDir, filename);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { content } = matter(fileContent);

        // 2. Parse ID for Output Filename
        // Regex to match [ID]Title_[CatID]Category
        // Matching [ID]Title_[CatID]Title.md OR [ID]Title_[Tag].md
        // Updated regex to support text IDs (like ASSET) and optional title suffix
        const FILENAME_REGEX = /^\[(?<movieId>\d+)\](?<movieTitle>.+)_\[(?<catId>[^\]]+)\](?<catTitle>.*)\.md$/;
        const match = filename.match(FILENAME_REGEX);

        if (!match || !match.groups) {
            return NextResponse.json({ error: 'Invalid filename format' }, { status: 400 });
        }

        const { movieId, catId } = match.groups;
        const articleId = `article_${movieId}_${catId}`;
        const outputFilename = `${articleId}.html`;

        // 3. Fetch Official Trailer from TMDB (to prevent AI Hallucinations)
        let officialTrailerKey = null;
        const tmdbKey = process.env.TMDB_API_KEY;
        if (tmdbKey && movieId) {
            try {
                console.log(`[API] Fetching videos for Movie ID: ${movieId}`);
                const videoRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
                    params: { api_key: tmdbKey }
                });

                // Find first YouTube Trailer
                const trailer = videoRes.data.results.find((v: any) => v.site === "YouTube" && v.type === "Trailer")
                    || videoRes.data.results.find((v: any) => v.site === "YouTube"); // Fallback to any YT video

                if (trailer) {
                    officialTrailerKey = trailer.key;
                    console.log(`[API] Found Trailer ID: ${officialTrailerKey}`);
                }
            } catch (err: any) {
                console.warn(`[API] Failed to fetch TMDB videos: ${err.message}`);
            }
        }

        // 4. Analyze Content for YouTube Links (Smart Detection)
        let videoInstruction = "";
        // Scan BOTH User Prompt and File Content
        const combinedText = prompt + "\n" + content;

        // Regex to finding all youtube links - Improved to ignore casing and surrounding chars
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
        const matches = [...combinedText.matchAll(ytRegex)];
        const videoIds = [...new Set(matches.map(m => m[1]))]; // Unique IDs

        console.log(`[API] Smart Detection: Found ${videoIds.length} unique videos.`);

        if (videoIds.length > 0) {
            videoInstruction = `
[SYSTEM: 10-VIDEO GRID LAYOUT MODE]
Analysis: Found ${videoIds.length} YouTube Video Link(s).
User Goal: Display these videos in a mandatory "10-Row Vertical Grid" layout.

MANDATORY HTML STRUCTURE:
1. Container: A vertical grid or flex column exactly 10 rows high (or scrollable).
2. Items: 10 distinct "Video Cards".
3. Content Per Card:
   - Video Title (Extract from the text above the link).
   - YouTube Iframe (Use the specific Key).

Specific Iframe Code for each Key (KEYS: ${JSON.stringify(videoIds)}):
<iframe 
    src="https://www.youtube.com/embed/{KEY}?autoplay=1&rel=0" 
    class="w-full aspect-video rounded-lg shadow-lg"
    ...
></iframe>

Layout CSS Requirement:
- Use CSS Grid: 'display: grid; grid-template-rows: repeat(10, auto); gap: 2rem;'
- OR Flex Column: 'display: flex; flex-direction: column; gap: 2rem;'
- Background: Dark cinematic theme.
- Typography: Stylish, sans-serif, white text.

CRITICAL: Do NOT output a plain text list. Output the visual GRID of 10 playable videos.
`;
        }

        // 5. Construct Full Prompt
        const fullPrompt = `${prompt}\n\n${videoInstruction}\n\nTARGET CONTENT (Source of Titles & Context):\n"${content}"`;

        // 4. Call AI (Grok)
        // Use custom content generation with specified model
        const config = {
            provider: provider as 'xAI' | 'Google',
            model: model || 'grok-4-1-fast-reasoning' // Default to fast-reasoning as requested
        };

        // Note: We pass fullPrompt as the 'prompt' argument.
        let generatedHtml = await generateCustomContent(fullPrompt, config);

        // 5. Clean Output (Remove ```html ... ``` if present)
        generatedHtml = generatedHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');

        // 6a. FORCE POST-PROCESSING (Text Links): Replace any surviving text links with Iframes
        const ytLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s<]{11})/gi;

        // We replace any raw text match of a youtube link with the iframe (ignoring if it's already in quotes/src to avoid double-processing, though imperfect regex)
        // Improved Regex to avoid matching inside src="..."
        // Actually, simpler strategy:
        // 1. Let text replacement happen (might result in nesting if inside src).
        // 2. Then run a "Cleaner" pass to fix nested iframes or just parse iframes.

        // BETTER STRATEGY: 
        // 1. Detect if the AI already made iframes.
        // 2. If so, Standardize them.

        const iframeRegex = /<iframe[^>]+src=["'](?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([^"'\?]+)[^"']*["'][^>]*>.*?<\/iframe>/gi;
        generatedHtml = generatedHtml.replace(iframeRegex, (match, videoId) => {
            return `
<div class="video-card w-full mb-8">
    <iframe 
        width="100%" 
        height="315"
        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&origin=http://localhost:3000" 
        class="w-full aspect-video rounded-lg shadow-2xl border-none"
        title="Detected Video"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen
    ></iframe>
</div>`;
        });

        // 6b. Fallback: If no iframes matched, try replacing text links (careful not to double up)
        // Since we ran iframe replacement first, any remaining youtube links are likely text.
        generatedHtml = generatedHtml.replace(ytLinkRegex, (match, videoId) => {
            // Check if this match is part of the standardized iframe we just made
            if (generatedHtml.includes(`embed/${videoId}`)) return match; // Already handled

            return `
<div class="video-card w-full mb-8">
    <iframe 
        width="100%" 
        height="315"
        src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0&origin=http://localhost:3000" 
        class="w-full aspect-video rounded-lg shadow-2xl border-none"
        title="Detected Video"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        referrerpolicy="strict-origin-when-cross-origin" 
        allowfullscreen
    ></iframe>
</div>`;
        });

        // 7. Save to Firebase Storage (Serverless Compatible)
        // Instead of local fs.writeFileSync (which fails on Netlify/Vercel)
        console.log('[API] Uploading to Firebase Storage...');
        const bucket = getAdminStorage().bucket();
        const file = bucket.file(`generated_visuals/${outputFilename}`);

        await file.save(generatedHtml, {
            metadata: {
                contentType: 'text/html',
                cacheControl: 'public, max-age=3600'
            }
        });

        // Make the file publicly accessible
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        console.log(`[API] File uploaded to: ${publicUrl}`);

        return NextResponse.json({
            success: true,
            message: 'HTML Generated & Uploaded Successfully',
            path: publicUrl,
            articleId: articleId
        });

    } catch (error: any) {
        console.error('Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

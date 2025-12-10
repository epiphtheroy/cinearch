import { generateCustomContent } from '@/lib/llm';

export const USER_GRID_PROMPT = `
Role Act as an expert Web Researcher and HTML Developer.

Task Your goal is to curate a list of EXACTLY 10 highly relevant YouTube videos based on the provided text. Requirement:

Distinct Content: The 10 videos must be distinct from each other (e.g., mix of official trailers, specific clips, interviews, analysis, or related works). Do not repeat the exact same video.

Display Format: For each of the 10 items, you must display the Approximate Video Title (as text) followed immediately by the Iframe Embed Code.

Input Text [INSERT YOUR TEXT HERE]

Step-by-Step Process

Analyze & Expand: Identify key entities in the text. If there are fewer than 10 direct references, infer related major works or genre classics to reach a target of 10.

Search & Verify: Find 10 working YouTube videos. Ensure the Video IDs are real.

Format: Output the result in HTML.

Strict Constraints & Formatting Rules

Quantity: EXACTLY 10 sets of (Title + Video).

Embed URL: Use https://www.youtube.com/embed/[VIDEO_ID]

Structure: Use the following HTML template for each item:

HTML

<div style="margin-bottom: 30px;">
    <h3>[Approximate Video Title]</h3>
    <iframe 
      width="450" 
      height="253" 
      src="https://www.youtube.com/embed/[REAL_VIDEO_ID]" 
      title="[Video Title]" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      referrerpolicy="strict-origin-when-cross-origin" 
      allowfullscreen>
    </iframe>
</div>
Output Provide ONLY the raw HTML code inside a code block. No conversational text.

Execution Generate the HTML output now based on the logic above.
`;

interface VisualGenConfig {
    content: string; // The article content
    provider?: 'xAI' | 'Google';
    model?: string;
}

export async function generateVisualHtml({ content, provider = 'Google', model = 'gemini-1.5-flash' }: VisualGenConfig): Promise<string> {

    // 1. Analyze Content for existing YouTube Links (Smart Detection)
    // Scan content to help the AI (optional, but good for context)
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/gi;
    const matches = [...content.matchAll(ytRegex)];
    const videoIds = [...new Set(matches.map(m => m[1]))]; // Unique IDs

    let systemInstruction = USER_GRID_PROMPT;

    if (videoIds.length > 0) {
        systemInstruction += `\n\n[HINT: I found these existing video IDs in the text, you may use them: ${videoIds.join(', ')}]`;
    }

    const fullPrompt = `${systemInstruction}\n\nTARGET CONTENT:\n"${content.substring(0, 15000)}"`; // Cap content length safety

    // 2. Call AI
    console.log('[VisualGen] Generating content with AI...');
    let generatedHtml = await generateCustomContent(fullPrompt, { provider, model });

    // 3. Clean Output
    generatedHtml = generatedHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');

    // 4. Force Post-Processing: Standardize Iframes
    // Logic: Replace any iframe (generated or text-link) with the Gold Standard 100% Width Layout

    // Step A: Detect generated iframes and replace/standardize attributes
    const iframeRegex = /<iframe[^>]+src=["'](?:https?:)?\/\/(?:www\.)?youtube\.com\/embed\/([^"'\?]+)[^"']*["'][^>]*>.*?<\/iframe>/gi;

    generatedHtml = generatedHtml.replace(iframeRegex, (match, videoId) => {
        return createStandardIframe(videoId);
    });

    // Step B: Text Link Fallback (in case AI just output links)
    const ytLinkRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s<]{11})/gi;
    generatedHtml = generatedHtml.replace(ytLinkRegex, (match, videoId) => {
        if (generatedHtml.includes(`embed/${videoId}`)) return match; // Already handled
        return createStandardIframe(videoId);
    });

    return generatedHtml;
}

function createStandardIframe(videoId: string): string {
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
}

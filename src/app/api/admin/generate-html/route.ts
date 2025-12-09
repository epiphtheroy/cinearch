import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateCustomContent } from '@/lib/llm'; // Reusing existing LLM wrapper
import matter from 'gray-matter';
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
        const outputDir = path.join(process.cwd(), 'public', 'generated_visuals');
        const outputPath = path.join(outputDir, outputFilename);

        // 3. Construct Full Prompt
        // Combine User Prompt + Article Content
        const fullPrompt = `
You are a creative frontend developer and designer. 
Your task is to create a stunning, self-contained HTML/CSS visual representation of the following text content.
The output must be a raw HTML file (no markdown code blocks, just the code).
It should be visually artistic, using modern CSS (animations, gradients, typography).
Do not include any external JS unless absolutely necessary (Vanilla CSS preferred).
Make it responsive.

TARGET CONTENT:
"${content}"

USER INSTRUCTION:
${prompt}

Remember: Output ONLY the HTML code.
        `;

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

        // 6. Save to File
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, generatedHtml);

        return NextResponse.json({
            success: true,
            message: 'HTML Generated Successfully',
            path: `/generated_visuals/${outputFilename}`,
            articleId: articleId
        });

    } catch (error: any) {
        console.error('Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

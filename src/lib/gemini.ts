import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function extractKeywords(text: string): Promise<string[]> {
    if (!process.env.GOOGLE_API_KEY) {
        console.warn('GOOGLE_API_KEY is missing. Skipping keyword extraction.');
        return [];
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
            Task: Analyze the PROVIDED TEXT strictly.
            Goal: Extract exactly 20 specific, unique keywords or concepts found IN THE TEXT that would be good search terms for YouTube video essays or analysis.
            
            Rules:
            1. ONLY extract terms that are explicitly mentioned or strictly relevant to the content of the text provided below.
            2. Do NOT hallucinate general terms not related to this specific movie/article.
            3. Include: Character names, Actor names, Director name, Key Themes, specific Scenes mentioned, Cinematography terms if discussed.
            4. Return strictly a JSON ARRAY of strings. No markdown.

            Text to Analyze:
            """
            ${text.substring(0, 15000)}
            """
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text().trim();

        console.log('[Gemini] Raw response:', textResponse.substring(0, 100) + '...');

        // Clean up markdown if present (e.g., ```json ... ```)
        const cleanJson = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

        const keywords = JSON.parse(cleanJson);

        if (Array.isArray(keywords)) {
            console.log(`[Gemini] Extracted ${keywords.length} keywords.`);
            return keywords.slice(0, 20); // Ensure max 20
        }
        console.warn('[Gemini] Failed to parse array, returned:', cleanJson);
        return [];

    } catch (error) {
        console.error('Error extracting keywords with Gemini:', error);
        return [];
    }
}

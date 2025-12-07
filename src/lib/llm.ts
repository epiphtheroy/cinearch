import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateMovieContent(movieTitle: string, promptTemplate: string): Promise<string> {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // Construct the final prompt
    let finalPrompt = promptTemplate;
    if (promptTemplate.includes('{{MOVIE}}')) {
        finalPrompt = promptTemplate.replace('{{MOVIE}}', movieTitle);
    } else {
        finalPrompt = `${promptTemplate}\n\nMovie Title: ${movieTitle}`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating content with Gemini:", error);
        throw error;
    }
}

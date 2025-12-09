import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Types for our config
interface categoryConfig {
    provider: 'Google' | 'xAI';
    model: string;
    apiKey?: string;
}

interface AiSettings {
    [category: string]: categoryConfig;
}

const CONFIG_PATH = path.join(process.cwd(), 'src/config/ai-settings.json');

// Helper to get config safely
function getConfig(categoryName: string): categoryConfig {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { provider: 'Google', model: 'gemini-1.5-pro-latest' };

        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const settings: AiSettings = JSON.parse(data);

        // Exact match or Uppercase match
        const config = settings[categoryName] || settings[categoryName.toUpperCase()];
        if (config) return config;

        // Fallback to Google if not found
        return { provider: 'Google', model: 'gemini-1.5-pro-latest' };
    } catch (e) {
        console.warn("Failed to read AI config, using default:", e);
        return { provider: 'Google', model: 'gemini-1.5-pro-latest' };
    }
}

export async function generateMovieContent(movieTitle: string, promptTemplate: string, categoryName: string): Promise<string> {
    const config = getConfig(categoryName);
    console.log(`[LLM] Generating for '${categoryName}' using ${config.provider} (${config.model})`);

    // Construct Prompt
    let finalPrompt = promptTemplate;
    if (finalPrompt.includes('{{MOVIE}}')) {
        finalPrompt = finalPrompt.replace('{{MOVIE}}', movieTitle);
    } else {
        finalPrompt = `${finalPrompt}\n\nMovie Title: ${movieTitle}`;
    }

    // Provider Logic
    if (config.provider === 'xAI') {
        return generateWithGrok(finalPrompt, config);
    } else {
        return generateWithGemini(finalPrompt, config);
    }
}

// Gemini Implementation
async function generateWithGemini(prompt: string, config: categoryConfig): Promise<string> {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Google API Key not found (Env or Config)");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: config.model || "gemini-1.5-pro-latest" });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
}

// Grok Implementation (OpenAI-compatible)
async function generateWithGrok(prompt: string, config: categoryConfig): Promise<string> {
    const apiKey = config.apiKey || process.env.XAI_API_KEY; // Fallback to env if needed
    if (!apiKey) throw new Error("xAI API Key not found (Config)");

    try {
        const response = await axios.post('https://api.x.ai/v1/chat/completions', {
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            model: config.model || "grok-beta",
            stream: false,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error("Grok/xAI Error:", error.response?.data || error.message);
        throw new Error(`Grok Generation Failed: ${error.message}`);
    }
}

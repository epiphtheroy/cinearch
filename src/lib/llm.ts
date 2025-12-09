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

const ENV_PATH = path.join(process.cwd(), '.env.local');

// Helper to get config safely
function getConfig(categoryName: string): categoryConfig {
    try {
        if (!fs.existsSync(ENV_PATH)) return { provider: 'Google', model: 'gemini-1.5-pro-latest' };

        const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        const match = envContent.match(/^AI_SETTINGS_BASE64=(.+)$/m);

        let settings: AiSettings = {};
        if (match && match[1]) {
            const jsonStr = Buffer.from(match[1], 'base64').toString('utf-8');
            settings = JSON.parse(jsonStr);
        }

        // Exact match or Uppercase match
        const config = settings[categoryName] || settings[categoryName.toUpperCase()];
        if (config) return config;

        // Fallback to Google if not found
        return { provider: 'Google', model: 'gemini-1.5-pro-latest' };
    } catch (_e) {
        console.warn("Failed to read AI config from .env.local, using default:", _e);
        return { provider: 'Google', model: 'gemini-1.5-pro-latest' };
    }
}

// Helper: Scan settings for any valid xAI key
function getAnyXaiApiKey(): string | undefined {
    try {
        if (!fs.existsSync(ENV_PATH)) return undefined;
        const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        const match = envContent.match(/^AI_SETTINGS_BASE64=(.+)$/m);
        if (match && match[1]) {
            const jsonStr = Buffer.from(match[1], 'base64').toString('utf-8');
            const settings: AiSettings = JSON.parse(jsonStr);
            // Look for any config using xAI with a key
            for (const key in settings) {
                if ((settings[key].provider === 'xAI' || key.toLowerCase() === 'xai') && settings[key].apiKey) {
                    return settings[key].apiKey;
                }
            }
        }
    } catch (e) { return undefined; }
    return undefined;
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
    const apiKey = config.apiKey || process.env.XAI_API_KEY || getAnyXaiApiKey(); // Fallback to found key
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

// Expose manual generation for Admin tools
export async function generateCustomContent(prompt: string, config: categoryConfig): Promise<string> {
    console.log(`[LLM] Manual Generation using ${config.provider} (${config.model})`);

    // Determine provider
    if (config.provider === 'xAI') {
        return generateWithGrok(prompt, config);
    } else {
        return generateWithGemini(prompt, config);
    }
}

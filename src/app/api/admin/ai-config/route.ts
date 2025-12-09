import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env.local');

// Helper to read invalid/partial JSON safely
function safeParse(str: string) {
    try {
        return JSON.parse(str);
    } catch (_e) {
        return {};
    }
}

export async function GET() {
    try {
        if (!fs.existsSync(ENV_PATH)) {
            return NextResponse.json({});
        }
        const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        const match = envContent.match(/^AI_SETTINGS_BASE64=(.+)$/m);

        if (match && match[1]) {
            const jsonStr = Buffer.from(match[1], 'base64').toString('utf-8');
            return NextResponse.json(safeParse(jsonStr));
        }

        return NextResponse.json({});
    } catch (_error) {
        return NextResponse.json({ error: 'Failed to read config from .env.local' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const jsonStr = JSON.stringify(body);
        const base64Str = Buffer.from(jsonStr).toString('base64');
        const newLine = `AI_SETTINGS_BASE64=${base64Str}`;

        let envContent = '';
        if (fs.existsSync(ENV_PATH)) {
            envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        }

        // Remove existing key if present
        const lines = envContent.split('\n');
        const newLines = lines.filter(line => !line.startsWith('AI_SETTINGS_BASE64='));

        // Append new key
        newLines.push(newLine);

        // Join and ensure single trailing newline
        const finalContent = newLines.join('\n').trim() + '\n';

        fs.writeFileSync(ENV_PATH, finalContent, 'utf-8');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Error:", error);
        return NextResponse.json({ error: 'Failed to save config to .env.local' }, { status: 500 });
    }
}

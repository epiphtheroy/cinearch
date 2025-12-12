import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import * as fs from 'fs';
import * as path from 'path';

function log(message: string) {
    const logPath = path.join(process.cwd(), 'deploy-log.txt');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    console.log(message);
}

export async function POST(_request: Request) {
    log('--- Deployment Request Started ---');
    // Force rebuild timestamp: 1
    try {
        // 1. Git Add
        // 30s timeout
        log('Executing: git add .');
        await execAsync('git add .', { timeout: 30000 });
        log('Finished: git add .');

        // 2. Git Commit
        // Force a commit even if there are no changes to trigger Netlify build
        // Use explicit author to avoid "Please tell me who you are" errors if config is missing
        const timestamp = new Date().toISOString();
        const commitMsg = `Auto-deploy from Admin Dashboard: ${timestamp}`;
        // -c options allow setting config just for this command
        log('Executing: git commit');
        await execAsync(`git -c user.name="CineArch Admin" -c user.email="admin@example.com" commit --allow-empty -m "${commitMsg}"`, { timeout: 30000 });
        log('Finished: git commit');

        // 3. Git Push
        log('Executing: git push');
        const { stdout, stderr } = await execAsync('git push', { timeout: 60000 });
        log('Finished: git push');

        return NextResponse.json({
            message: "Successfully pushed to GitHub.",
            details: stdout + (stderr ? ` (Stderr: ${stderr})` : "")
        });

    } catch (error: any) {
        log(`Deploy Error: ${error.message}`);
        console.error("Deploy Error:", error);
        return NextResponse.json({
            error: "Deployment failed.",
            details: error.message
        }, { status: 500 });
    }
}

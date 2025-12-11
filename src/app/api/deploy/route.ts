import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(_request: Request) {
    try {
        // 1. Git Add
        await execAsync('git add .');

        // 2. Git Commit
        // Force a commit even if there are no changes to trigger Netlify build
        const timestamp = new Date().toISOString();
        await execAsync(`git commit --allow-empty -m "Auto-deploy from Admin Dashboard: ${timestamp}"`);

        // 3. Git Push
        const { stdout, stderr } = await execAsync('git push');

        return NextResponse.json({
            message: "Successfully pushed to GitHub.",
            details: stdout || stderr
        });

    } catch (error: any) {
        console.error("Deploy Error:", error);
        return NextResponse.json({
            error: "Deployment failed.",
            details: error.message
        }, { status: 500 });
    }
}

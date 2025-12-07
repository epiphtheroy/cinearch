import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(_request: Request) {
    try {
        // 1. Git Add
        await execAsync('git add .');

        // 2. Git Commit
        // We need to handle the case where there are no changes to commit
        try {
            await execAsync('git commit -m "Auto-deploy from Admin Dashboard"');
        } catch (error: any) {
            if (error.stdout && error.stdout.includes('nothing to commit')) {
                // Continue to push even if nothing to commit
                console.log("Nothing to commit, proceeding to push...");
            } else {
                throw error;
            }
        }

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

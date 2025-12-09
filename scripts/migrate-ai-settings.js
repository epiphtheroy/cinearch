const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(process.cwd(), 'src/config/ai-settings.json');
const ENV_PATH = path.join(process.cwd(), '.env.local');

function migrate() {
    if (!fs.existsSync(JSON_PATH)) {
        console.log('No ai-settings.json found to migrate.');
        return;
    }

    try {
        const jsonContent = fs.readFileSync(JSON_PATH, 'utf-8');
        // Validate JSON
        const jsonData = JSON.parse(jsonContent);
        const base64Str = Buffer.from(JSON.stringify(jsonData)).toString('base64');
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
        console.log('Successfully migrated settings to .env.local');

        // Delete JSON file
        fs.unlinkSync(JSON_PATH);
        console.log('Deleted ai-settings.json');

    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();

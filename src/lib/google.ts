import { google } from 'googleapis';

// Initialize auth - assumes GOOGLE_APPLICATION_CREDENTIALS env var is set
// or we can manually load from a path if needed.
// Initialize auth
// Support both file path (local) and JSON content (Netlify env var)
const authOptions: any = {
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/documents.readonly'
    ]
};

if (process.env.GOOGLE_CREDENTIALS_JSON) {
    authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
}
// Else it falls back to GOOGLE_APPLICATION_CREDENTIALS automatically

const auth = new google.auth.GoogleAuth(authOptions);

const sheets = google.sheets({ version: 'v4', auth });
const docs = google.docs({ version: 'v1', auth });

export interface MovieQueueItem {
    rowIndex: number; // 0-indexed, including header
    tmdbId: string;   // Changed from movieTitle
    status: string;
    promptDocId?: string; // Optional if we want to override per row
}

// Configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
// Column indices (0-based) based on: TMDB_ID | Movie Title | Status | Category
const COL_TMDB_ID = 0;
// const COL_TITLE_IGNORED = 1; // Just for reference in sheet
const COL_STATUS = 2; // Column C
const COL_CATEGORY = 3; // Column D

export async function getMovieQueue(): Promise<MovieQueueItem[]> {
    if (!SPREADSHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:D100', // Expanded range to include Col D
    });

    const rows = response.data.values;
    if (!rows) return [];

    const queue: MovieQueueItem[] = [];
    rows.forEach((row, index) => {
        const tmdbId = row[COL_TMDB_ID]?.toString().trim();
        const status = row[COL_STATUS];
        const category = row[COL_CATEGORY];

        // Check if status is '1' (Single) or '2' (Batch) and we have an ID
        if (tmdbId && (status === '1' || status === '2')) {
            queue.push({
                rowIndex: index + 2, // +2 because 1-based and header row
                tmdbId: tmdbId,
                status: status,
                promptDocId: category // For Status 1, this is category. For 2, maybe empty.
            });
        }
    });

    return queue;
}

export async function getPromptContent(docId: string): Promise<string> {
    try {
        const doc = await docs.documents.get({
            documentId: docId,
        });

        const content = doc.data.body?.content;
        if (!content) return "";

        return readStructuralElements(content);
    } catch (error) {
        console.error(`Error reading doc ${docId}:`, error);
        throw error;
    }
}

export async function updateRowStatus(rowIndex: number, newStatus: string) {
    if (!SPREADSHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!C${rowIndex}`, // Status is now Column C
        valueInputOption: 'RAW',
        requestBody: {
            values: [[newStatus]]
        }
    });
}

// Helper to extract Doc ID from URL or return as is
// function extractDocId(input: string): string | undefined {
//     if (!input) return undefined;
//     // Simple regex for standard doc URLs
//     const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
//     return match ? match[1] : input;
// }

// Helper to parse Google Doc content
function readStructuralElements(elements: any[]): string {
    let text = '';
    for (const value of elements) {
        if (value.paragraph) {
            for (const elem of value.paragraph.elements) {
                if (elem.textRun) {
                    text += elem.textRun.content;
                }
            }
        } else if (value.table) {
            // Handle tables if necessary, for now skip or simple parse
            for (const row of value.table.tableRows) {
                for (const cell of row.tableCells) {
                    text += readStructuralElements(cell.content) + " | ";
                }
                text += "\n";
            }
        }
    }
    return text;
}

import { google } from 'googleapis';

// Initialize auth - assumes GOOGLE_APPLICATION_CREDENTIALS env var is set
// or we can manually load from a path if needed.
const auth = new google.auth.GoogleAuth({
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/documents.readonly'
    ]
});

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
// Column indices (0-based)
const COL_TMDB_ID = 0; // Was COL_TITLE
const COL_STATUS = 1;
const COL_CATEGORY = 2; // Changed from COL_PROMPT

export async function getMovieQueue(): Promise<MovieQueueItem[]> {
    if (!SPREADSHEET_ID) throw new Error("GOOGLE_SHEET_ID not set");

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A2:C100', // Adjust range as needed
    });

    const rows = response.data.values;
    if (!rows) return [];

    const queue: MovieQueueItem[] = [];
    rows.forEach((row, index) => {
        const tmdbId = row[COL_TMDB_ID]?.toString().trim(); // Ensure string
        const status = row[COL_STATUS];
        const category = row[COL_CATEGORY];

        // Check if status is '1' (Ready) and we have an ID
        if (tmdbId && status === '1') {
            queue.push({
                rowIndex: index + 2, // +2 because 1-based and header row
                tmdbId: tmdbId,
                status: status,
                promptDocId: category // We temporarily store category name here, will map later
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
        range: `Sheet1!B${rowIndex}`, // Assuming Status is Column B
        valueInputOption: 'RAW',
        requestBody: {
            values: [[newStatus]]
        }
    });
}

// Helper to extract Doc ID from URL or return as is
function extractDocId(input: string): string | undefined {
    if (!input) return undefined;
    // Simple regex for standard doc URLs
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
}

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

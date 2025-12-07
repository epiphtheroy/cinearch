// Map Category Names (from Google Sheet) to Google Doc IDs
// User should populate this with their actual Doc IDs
export const PROMPT_MAP: Record<string, string> = {
    // Existing (Lowercase as per previous usage, but allow Uppercase linkage)
    "location": "1xtW80KPa0uVPfQSNo5D8JEfhzPsvCwGZy3gij047HUA",
    "signifier": "1AXGy0l0_2d71psPVo4PyRaweK1GqRpEt2lI0vgzvkTg",

    // 30 Batch Categories
    "ASSET": "",
    "MATRIX": "",
    "LOCATION": "1xtW80KPa0uVPfQSNo5D8JEfhzPsvCwGZy3gij047HUA", // Mapped to existing
    "SIGNIFIER": "1AXGy0l0_2d71psPVo4PyRaweK1GqRpEt2lI0vgzvkTg", // Mapped to existing
    "CONTEXT": "",
    "PROCESS": "",
    "PHENOMENON": "",
    "NOUMENON": "",
    "ENIGMA": "",
    "CHARACTER": "",
    "PSYCHO": "",
    "FIGURE": "",
    "PHILOSOPHY": "",
    "POLITICAL": "",
    "ESSAY": "",
    "FACE": "",
    "METACRITIC": "",
    "REALISM": "",
    "AESTHETIC": "",
    "LEDGER": "",
    "BUSINESS": "",
    "TBD1": "",
    "TBD2": "",
    "TBD3": "",
    "TBD4": "",
    "TBD5": "",
    "TBD6": "",
    "TBD7": "",
    "TBD8": "",
    "TBD9": "",

    // Default fallback
    "Default": process.env.DEFAULT_PROMPT_DOC_ID || "",
};

// Helper: List of all 30 batch categories
export const BATCH_CATEGORIES = [
    "ASSET", "MATRIX", "LOCATION", "SIGNIFIER", "CONTEXT",
    "PROCESS", "PHENOMENON", "NOUMENON", "ENIGMA", "CHARACTER",
    "PSYCHO", "FIGURE", "PHILOSOPHY", "POLITICAL", "ESSAY",
    "FACE", "METACRITIC", "REALISM", "AESTHETIC", "LEDGER",
    "BUSINESS", "TBD1", "TBD2", "TBD3", "TBD4", "TBD5",
    "TBD6", "TBD7", "TBD8", "TBD9"
];

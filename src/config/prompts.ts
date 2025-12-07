// Map Category Names (from Google Sheet) to Google Doc IDs
// User should populate this with their actual Doc IDs
export const PROMPT_MAP: Record<string, string> = {
    // Existing (Lowercase as per previous usage, but allow Uppercase linkage)
    "location": "1xtW80KPa0uVPfQSNo5D8JEfhzPsvCwGZy3gij047HUA",
    "signifier": "1AXGy0l0_2d71psPVo4PyRaweK1GqRpEt2lI0vgzvkTg",

    // 30 Batch Categories
    "ASSET": "19C8E0R3k2f_dzl1JfQit4lwr-cbtZYxraTTtCxX91dQ",
    "MATRIX": "1Jn0EvrpbfyV7tJBqavc1ZBSnEqRs-V2ko-bh8kRDAgk",
    "LOCATION": "1xtW80KPa0uVPfQSNo5D8JEfhzPsvCwGZy3gij047HUA", // Mapped to existing
    "SIGNIFIER": "1AXGy0l0_2d71psPVo4PyRaweK1GqRpEt2lI0vgzvkTg", // Mapped to existing
    "CONTEXT": "1lMoCIvnHTFDi7K2JLp-I7qxj5WnW1q8nOyzD2MaL0i4",
    "PROCESS": "19txFHe2siaKe2FitdHPnrHBSueCFnF2YAPthbFzjijY",
    "PHENOMENON": "1FiFjEeP_Ae9W6V4udnvNfQOGw5ckoELDxZwLXdY33IE",
    "NOUMENON": "1SVoyPWMsVeXaUdWgDtW2qCCAn-wE3U2Y7bBintXONpY",
    "ENIGMA": "1YO2oQuSf8jP89fmhB_IoNf9DaYJGsEfTsmfMX9NjifI",
    "CHARACTER": "1T8zw_9RIQA7FqSzlxPUkoaC0HILFVuwV5ljRWAroLE",
    "PSYCHO": "1PMhr-5czsreYJQys2acYBWef1yXa9DJUpnQycYoLM1o",
    "FIGURE": "1RRUDvWty3vJO5wjWGf4fURtZMMglJ8hYZSsClRihmHE",
    "PHILOSOPHY": "1KBsDX36ZvUbBmbqNo2XpnmuUBELq2z9xWZn6TlAjsnU",
    "POLITICAL": "1_yd642oiGu4mrHUNkT4cBXefUFgWAgNsfQaDRiXPMdM",
    "ESSAY": "1bY3heFM8GwN5J4rnX-fp8gMppVvIDhTkOSOwZIITSDg",
    "FACE": "1bqGUzyD9vSmlhjdoGiwksS39FgIF8Yory0_SBk9cgf0",
    "METACRITIC": "1fJbXilUSLp3XD5c3B2p1hBfKvT5OBYKGaRm9tHFFSY0",
    "REALISM": "1S15SA3PLRWtYU-OflHKDjtKOaHXPLuo5RzuANSsCRFo",
    "AESTHETIC": "1AwGRek2NiTyrCXJ1dQnNiuntdJNs7pqmgqIRscT3eOw",
    "LEDGER": "12PlXN4UPDfbBvX_epcTW6BGnVmUCxwnGA2KqZZAD3eM",
    "BUSINESS": "1uIoidCY3FYLOPTawksdha8j4bvi4ycb8HSBuA9ASjzc",
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

// Map Category Names (from Google Sheet) to Google Doc IDs
// User should populate this with their actual Doc IDs
export const PROMPT_MAP: Record<string, string> = {
    // 1. 앞에 있던 //를 지웠습니다.
    // 2. location ID 끝에 빠진 따옴표(")를 추가했습니다.
    "location": "1xtW80KPa0uVPfQSNo5D8JEfhzPsvCwGZy3gij047HUA",
    "signifier": "1AXGy0l0_2d71psPVo4PyRaweK1GqRpEt2lI0vgzvkTg",

    // Default fallback
    "Default": process.env.DEFAULT_PROMPT_DOC_ID || "",
};

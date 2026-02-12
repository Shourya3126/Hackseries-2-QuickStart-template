/**
 * AI Service Stubs
 * In production, replace these with real ML model calls.
 */
const crypto = require("crypto");

// ── Face Liveness (Stub) ──────────────────────────────
/**
 * Simulates liveness detection on a selfie.
 * Returns { alive: boolean, confidence: number }
 */
function checkLiveness(imageBase64) {
    // Stub — always returns alive for hackathon demo
    return {
        alive: true,
        confidence: 0.95,
        message: "Liveness check passed (stub)",
    };
}

// ── Text Anonymizer ───────────────────────────────────
/**
 * Removes PII from text using regex patterns.
 * Strips emails, phone numbers, Aadhaar-like numbers, and common name patterns.
 */
function anonymizeText(text) {
    let cleaned = text;

    // Remove email addresses
    cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]");

    // Remove phone numbers (Indian + international)
    cleaned = cleaned.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, "[PHONE REDACTED]");

    // Remove Aadhaar-like (12 digit) numbers
    cleaned = cleaned.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[ID REDACTED]");

    // Remove names that look like "Mr./Mrs./Dr. Firstname Lastname"
    cleaned = cleaned.replace(/(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?/g, "[NAME REDACTED]");

    return cleaned;
}

// ── Complaint Classifier ──────────────────────────────
/**
 * Keyword-based classification + priority scoring.
 */
function classifyComplaint(text) {
    const lower = text.toLowerCase();

    // Category detection
    const categoryKeywords = {
        Infrastructure: ["building", "road", "electricity", "water", "wifi", "internet", "lab", "classroom", "toilet", "washroom", "parking"],
        Academic: ["exam", "marks", "grade", "syllabus", "lecture", "assignment", "project", "professor", "teacher", "class"],
        Hostel: ["hostel", "mess", "food", "room", "warden", "curfew", "laundry", "roommate"],
        Faculty: ["professor", "teacher", "faculty", "lecturer", "behaviour", "behavior", "harassment", "discrimination"],
    };

    let category = "Other";
    let maxHits = 0;
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        const hits = keywords.filter((kw) => lower.includes(kw)).length;
        if (hits > maxHits) {
            maxHits = hits;
            category = cat;
        }
    }

    // Priority scoring (0-100)
    const urgentWords = ["urgent", "immediately", "danger", "unsafe", "emergency", "critical", "harassment", "threat"];
    const urgentHits = urgentWords.filter((w) => lower.includes(w)).length;
    const priorityScore = Math.min(100, 30 + urgentHits * 20 + Math.min(text.length / 10, 20));

    let priority = "low";
    if (priorityScore >= 80) priority = "critical";
    else if (priorityScore >= 60) priority = "high";
    else if (priorityScore >= 40) priority = "medium";

    return { category, priority, priorityScore: Math.round(priorityScore) };
}

/**
 * Generate a SHA-256 hash of the original complaint text.
 */
function hashText(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

module.exports = {
    checkLiveness,
    anonymizeText,
    classifyComplaint,
    hashText,
};

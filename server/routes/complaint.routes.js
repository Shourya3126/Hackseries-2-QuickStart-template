const express = require("express");
const Joi = require("joi");
const router = express.Router();

const Complaint = require("../models/Complaint");
const validate = require("../middleware/validate");
const { authMiddleware, requireRole } = require("../middleware/auth");
const algorand = require("../services/algorand.service");
const ai = require("../services/ai.service");

// ── Schemas ────────────────────────────────────────────
const createComplaintSchema = Joi.object({
    text: Joi.string().min(10).max(5000).required(),
    category: Joi.string()
        .valid("Infrastructure", "Academic", "Hostel", "Faculty", "Other")
        .optional(),
});

// ── POST /api/complaint ────────────────────────────────
router.post(
    "/",
    authMiddleware,
    validate(createComplaintSchema),
    async (req, res, next) => {
        try {
            const rawText = req.body.text;

            // 1. Hash original for tamper-proof record
            const originalHash = ai.hashText(rawText);

            // 2. Anonymize PII
            const anonymizedText = ai.anonymizeText(rawText);

            // 3. Auto-classify (override if user provided category)
            const classification = ai.classifyComplaint(anonymizedText);
            const category = req.body.category || classification.category;

            // 4. Store hash on Algorand
            const { txId } = await algorand.storeComplaintHash(originalHash);

            // 5. Save to DB
            const complaint = await Complaint.create({
                originalHash,
                anonymizedText,
                category,
                priority: classification.priority,
                priorityScore: classification.priorityScore,
                txHash: txId,
            });

            res.status(201).json({
                complaint: {
                    id: complaint._id,
                    ref: `C-${complaint._id.toString().slice(-4).toUpperCase()}`,
                    category: complaint.category,
                    priority: complaint.priority,
                    priorityScore: complaint.priorityScore,
                    txHash: complaint.txHash,
                },
                message: "Complaint submitted anonymously",
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/complaints (admin only) ───────────────────
router.get(
    "/",
    authMiddleware,
    requireRole("admin"),
    async (req, res, next) => {
        try {
            const complaints = await Complaint.find().sort({ createdAt: -1 });
            res.json({ complaints });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;

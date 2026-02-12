/**
 * ──────────────────────────────────────────────────────────────
 *  Blockchain Complaint Routes
 * ──────────────────────────────────────────────────────────────
 *
 *  POST /api/chain/complaint/submit-unsigned
 *       → Builds unsigned TX with hash of complaint text
 *
 *  POST /api/chain/complaint/submit-signed
 *       → Broadcasts signed blob, saves to DB
 *
 *  GET  /api/chain/complaint/verify/:txId
 *       → Proof of Integrity: verifies that the hash on-chain
 *         matches the text in the DB.
 *
 *  On-chain note:
 *  {
 *    app: "TrustSphere",
 *    type: "complaint",
 *    data: { hash, category, priority, timestamp }
 *  }
 * ──────────────────────────────────────────────────────────────
 */
const express = require("express");
const Joi = require("joi");
const crypto = require("crypto");
const router = express.Router();

const Complaint = require("../models/Complaint");
const { authMiddleware, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const blockchain = require("../blockchain/algorand.service");
const ai = require("../services/ai.service");

// ── Helpers ────────────────────────────────────────────────────

function sha256(input) {
    return crypto.createHash("sha256").update(String(input)).digest("hex");
}

// ── Schemas ────────────────────────────────────────────────────

const submitUnsignedSchema = Joi.object({
    text: Joi.string().min(10).max(5000).required(),
    category: Joi.string()
        .valid("Infrastructure", "Academic", "Hostel", "Faculty", "Other")
        .optional(),
    senderAddress: Joi.string().length(58).required(),
});

const submitSignedSchema = Joi.object({
    signedTxn: Joi.string().required(),
    text: Joi.string().required(),
    category: Joi.string().optional(),
});

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/complaint/submit-unsigned
// ──────────────────────────────────────────────────────────────
router.post(
    "/submit-unsigned",
    authMiddleware,
    validate(submitUnsignedSchema),
    async (req, res, next) => {
        try {
            const { text, category, senderAddress } = req.body;

            // 1. Compute hash of the text (proof of integrity)
            const textHash = sha256(text);

            // 2. AI Anonymization & Classification (for Metadata)
            // Note: We only put the category/priority on-chain, NOT the text
            const anonymizedText = ai.anonymizeText(text);
            const classification = ai.classifyComplaint(anonymizedText);
            const finalCategory = category || classification.category;

            // 3. Build data for on-chain note
            const complaintData = {
                type: "complaint",
                data: {
                    hash: textHash,
                    category: finalCategory,
                    priority: classification.priority,
                },
            };

            // 4. Create unsigned TX
            const unsignedTxn = await blockchain.createUnsignedTx(
                complaintData,
                senderAddress
            );

            res.json({
                unsignedTxn,
                complaintData: complaintData.data,
                message: "Sign this transaction to submit your complaint with blockchain proof",
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/complaint/submit-signed
// ──────────────────────────────────────────────────────────────
router.post(
    "/submit-signed",
    authMiddleware,
    validate(submitSignedSchema),
    async (req, res, next) => {
        try {
            const { signedTxn, text, category } = req.body;

            // 1. Broadcast to Algorand
            const result = await blockchain.submitSignedTx(signedTxn);

            // 2. Process text again for DB storage
            const originalHash = sha256(text);
            const anonymizedText = ai.anonymizeText(text);
            const classification = ai.classifyComplaint(anonymizedText);
            const finalCategory = category || classification.category;

            // 3. Save to DB
            const complaint = await Complaint.create({
                originalHash,           // matches on-chain hash
                anonymizedText,         // safe for admins to read
                category: finalCategory,
                priority: classification.priority,
                priorityScore: classification.priorityScore,
                txHash: result.txId,    // link to proofs
            });

            res.json({
                message: "Complaint submitted with blockchain integrity proof",
                complaintId: complaint._id,
                txId: result.txId,
                confirmed: result.confirmed,
                round: result.round,
                explorerUrl: `https://testnet.explorer.perawallet.app/tx/${result.txId}`,
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  GET /api/chain/complaint/verify/:txId
// ──────────────────────────────────────────────────────────────
router.get("/verify/:txId", async (req, res, next) => {
    try {
        const { txId } = req.params;

        // 1. Verify on-chain record
        const chainVerification = await blockchain.verifyRecord(txId, "complaint");

        // 2. Find in DB
        let dbRecord = null;
        let integrityMatch = false;

        const complaint = await Complaint.findOne({ txHash: txId });
        if (complaint && chainVerification.valid) {
            // Check if DB hash matches Chain hash
            // chain.data.hash vs db.originalHash
            const chainHash = chainVerification.record.data.hash;
            integrityMatch = (chainHash === complaint.originalHash);

            dbRecord = {
                id: complaint._id,
                category: complaint.category,
                priority: complaint.priority,
                createdAt: complaint.createdAt,
                integrityMatch,
            };
        }

        res.json({
            verified: chainVerification.valid,
            integrityMatch, // True if on-chain hash == DB hash
            blockchain: {
                txId: chainVerification.txId,
                sender: chainVerification.sender,
                round: chainVerification.round,
                timestamp: chainVerification.timestamp,
                record: chainVerification.record,
            },
            database: dbRecord,
            explorerUrl: `https://testnet.explorer.perawallet.app/tx/${txId}`,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

/**
 * ──────────────────────────────────────────────────────────────
 *  Blockchain Attendance Routes
 * ──────────────────────────────────────────────────────────────
 *
 *  POST /api/chain/attendance/create-unsigned
 *       → Builds an unsigned Algorand TX with attendance data
 *
 *  POST /api/chain/attendance/submit-signed
 *       → Broadcasts the user-signed blob, saves record in DB
 *
 *  GET  /api/chain/attendance/verify/:txId
 *       → Reads the TX from Algorand and validates it
 *
 *  Rules:
 *    • One student per session (enforced in DB + on-chain note)
 *    • Immutable — once on-chain, cannot be edited
 *    • Teacher cannot edit attendance records
 * ──────────────────────────────────────────────────────────────
 */
const express = require("express");
const Joi = require("joi");
const crypto = require("crypto");
const router = express.Router();

const Session = require("../models/Session");
const { authMiddleware, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const blockchain = require("../blockchain/algorand.service");

// ── Helpers ────────────────────────────────────────────────────

/** SHA-256 hash, returns hex string */
function sha256(input) {
    return crypto.createHash("sha256").update(String(input)).digest("hex");
}

/** Build device fingerprint hash from request headers */
function deviceHash(req) {
    const raw = [
        req.headers["user-agent"] || "",
        req.headers["accept-language"] || "",
        req.ip || "",
    ].join("|");
    return sha256(raw);
}

// ── Schemas ────────────────────────────────────────────────────

const createUnsignedSchema = Joi.object({
    sessionId: Joi.string().required(),
    qrCode: Joi.string().required(),
    selfieBase64: Joi.string().allow("").default(""),
    senderAddress: Joi.string().length(58).required(),
});

const submitSignedSchema = Joi.object({
    signedTxn: Joi.string().required(),
    sessionId: Joi.string().required(),
});

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/attendance/create-unsigned
// ──────────────────────────────────────────────────────────────
router.post(
    "/create-unsigned",
    authMiddleware,
    requireRole("student"),
    validate(createUnsignedSchema),
    async (req, res, next) => {
        try {
            const { sessionId, qrCode, selfieBase64, senderAddress } = req.body;

            // ── 1. Validate session & QR ──────────────────────────
            const session = await Session.findById(sessionId);
            if (!session || !session.active) {
                return res.status(404).json({ error: "Session not found or inactive" });
            }
            if (session.qrSecret !== qrCode || new Date() > session.qrExpiresAt) {
                return res.status(400).json({ error: "QR code expired or invalid" });
            }

            // ── 2. One student one session ────────────────────────
            const alreadyMarked = session.attendees.some(
                (a) => a.studentId && a.studentId.toString() === req.user.id
            );
            if (alreadyMarked) {
                return res.status(409).json({ error: "Attendance already marked for this session" });
            }

            // ── 3. Build hashes ───────────────────────────────────
            const studentHash = sha256(req.user.id);
            const faceHash = selfieBase64 ? sha256(selfieBase64) : sha256("no-selfie");
            const devHash = deviceHash(req);
            const timestamp = new Date().toISOString();

            // ── 4. Build attendance data for on-chain note ────────
            const attendanceData = {
                type: "attendance",
                data: {
                    studentHash,
                    sessionId,
                    faceHash,
                    deviceHash: devHash,
                    time: timestamp,
                },
            };

            // ── 5. Create unsigned TX via blockchain service ──────
            const unsignedTxn = await blockchain.createUnsignedTx(
                attendanceData,
                senderAddress
            );

            res.json({
                unsignedTxn,
                attendanceData: {
                    studentHash,
                    sessionId,
                    faceHash,
                    deviceHash: devHash,
                    time: timestamp,
                },
                message: "Sign this transaction with your Pera Wallet to mark attendance",
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/attendance/submit-signed
// ──────────────────────────────────────────────────────────────
router.post(
    "/submit-signed",
    authMiddleware,
    requireRole("student"),
    validate(submitSignedSchema),
    async (req, res, next) => {
        try {
            const { signedTxn, sessionId } = req.body;

            // ── 1. Re-validate session & duplicate ────────────────
            const session = await Session.findById(sessionId);
            if (!session || !session.active) {
                return res.status(404).json({ error: "Session not found or inactive" });
            }

            const alreadyMarked = session.attendees.some(
                (a) => a.studentId && a.studentId.toString() === req.user.id
            );
            if (alreadyMarked) {
                return res.status(409).json({ error: "Attendance already marked" });
            }

            // ── 2. Broadcast signed TX to Algorand ────────────────
            const result = await blockchain.submitSignedTx(signedTxn);

            // ── 3. Save attendee to DB (immutable record) ─────────
            session.attendees.push({
                studentId: req.user.id,
                txId: result.txId,
                markedAt: new Date(),
            });
            await session.save();

            res.json({
                message: "Attendance recorded on Algorand blockchain",
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
//  GET /api/chain/attendance/verify/:txId
// ──────────────────────────────────────────────────────────────
router.get("/verify/:txId", async (req, res, next) => {
    try {
        const { txId } = req.params;

        // Use the blockchain service to verify this is a valid attendance record
        const verification = await blockchain.verifyRecord(txId, "attendance");

        // Also check our DB for the matching record
        let dbRecord = null;
        const session = await Session.findOne({ "attendees.txId": txId });

        if (session) {
            const attendee = session.attendees.find((a) => a.txId === txId);
            dbRecord = {
                sessionTitle: session.title,
                sessionDate: session.createdAt,
                markedAt: attendee?.markedAt,
                studentId: attendee?.studentId,
            };
        }

        res.json({
            verified: verification.valid,
            blockchain: {
                txId: verification.txId,
                sender: verification.sender,
                round: verification.round,
                timestamp: verification.timestamp,
                record: verification.record,
                errors: verification.errors,
            },
            database: dbRecord,
            explorerUrl: `https://testnet.explorer.perawallet.app/tx/${txId}`,
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

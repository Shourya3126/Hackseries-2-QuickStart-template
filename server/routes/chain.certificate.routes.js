/**
 * ──────────────────────────────────────────────────────────────
 *  Blockchain Certificate Routes
 * ──────────────────────────────────────────────────────────────
 *
 *  POST /api/chain/cert/mint-unsigned
 *       → Builds unsigned TX to mint a certificate on-chain
 *
 *  POST /api/chain/cert/submit
 *       → Broadcasts signed blob, saves certificate in DB
 *
 *  GET  /api/chain/cert/verify/:txId
 *       → PUBLIC endpoint — reads on-chain note, returns metadata
 *         (used by QR scan and public verify page)
 *
 *  On-chain note:
 *  {
 *    app: "TrustSphere",
 *    type: "certificate",
 *    data: { student, event, role, ipfsHash, issuedBy, issuedAt }
 *  }
 * ──────────────────────────────────────────────────────────────
 */
const express = require("express");
const Joi = require("joi");
const crypto = require("crypto");
const router = express.Router();

const Certificate = require("../models/Certificate");
const User = require("../models/User");
const { authMiddleware, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const blockchain = require("../blockchain/algorand.service");

// ── Helpers ────────────────────────────────────────────────────

function sha256(input) {
    return crypto.createHash("sha256").update(String(input)).digest("hex");
}

/** Generate a compact verification URL for QR codes */
function verifyUrl(txId) {
    const base =
        process.env.FRONTEND_URL || "http://localhost:8080";
    return `${base}/verify/cert/${txId}`;
}

// ── Schemas ────────────────────────────────────────────────────

const mintUnsignedSchema = Joi.object({
    recipientId: Joi.string().required(),
    student: Joi.string().min(1).max(200).required(),
    event: Joi.string().min(1).max(300).required(),
    role: Joi.string().min(1).max(100).required(),
    ipfsHash: Joi.string().allow("").default(""),
    description: Joi.string().max(1000).allow("").default(""),
    senderAddress: Joi.string().length(58).required(),
});

const submitSignedSchema = Joi.object({
    signedTxn: Joi.string().required(),
    recipientId: Joi.string().required(),
    student: Joi.string().required(),
    event: Joi.string().required(),
    role: Joi.string().required(),
    ipfsHash: Joi.string().allow("").default(""),
    description: Joi.string().allow("").default(""),
});

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/cert/mint-unsigned
// ──────────────────────────────────────────────────────────────
router.post(
    "/mint-unsigned",
    authMiddleware,
    requireRole("teacher", "admin"),
    validate(mintUnsignedSchema),
    async (req, res, next) => {
        try {
            const {
                recipientId,
                student,
                event,
                role,
                ipfsHash,
                description,
                senderAddress,
            } = req.body;

            // Validate recipient exists
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                return res.status(404).json({ error: "Recipient user not found" });
            }

            // Check for duplicate certificate (same student + event)
            const existingCert = await Certificate.findOne({
                recipientId,
                title: event,
            });
            if (existingCert) {
                return res.status(409).json({
                    error: "Certificate already issued for this student and event",
                    existingTxHash: existingCert.txHash,
                });
            }

            const issuedAt = new Date().toISOString();

            // Build certificate data for on-chain note
            const certData = {
                type: "certificate",
                data: {
                    student,
                    event,
                    role,
                    ipfsHash: ipfsHash || "",
                    issuedBy: req.user.id,
                    issuedAt,
                    recipientId,
                    certHash: sha256(`${student}:${event}:${role}:${issuedAt}`),
                },
            };

            // Create unsigned TX
            const unsignedTxn = await blockchain.createUnsignedTx(
                certData,
                senderAddress
            );

            res.json({
                unsignedTxn,
                certData: certData.data,
                message: "Sign this transaction with your Pera Wallet to mint the certificate",
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/cert/submit
// ──────────────────────────────────────────────────────────────
router.post(
    "/submit",
    authMiddleware,
    requireRole("teacher", "admin"),
    validate(submitSignedSchema),
    async (req, res, next) => {
        try {
            const {
                signedTxn,
                recipientId,
                student,
                event,
                role,
                ipfsHash,
                description,
            } = req.body;

            // Broadcast to Algorand
            const result = await blockchain.submitSignedTx(signedTxn);

            // Save certificate to DB
            const certificate = await Certificate.create({
                recipientId,
                title: event,
                issuer: req.user.id,
                description: description || `${role} — ${event}`,
                metadata: {
                    standard: "arc3",
                    student,
                    event,
                    role,
                    ipfsHash: ipfsHash || "",
                    issuedAt: new Date().toISOString(),
                    issuedBy: req.user.id,
                    certHash: sha256(`${student}:${event}:${role}:${new Date().toISOString()}`),
                },
                txHash: result.txId,
            });

            // Generate QR data (verification URL)
            const qrData = verifyUrl(result.txId);

            res.json({
                message: "Certificate minted on Algorand blockchain",
                certificate: {
                    id: certificate._id,
                    title: certificate.title,
                    student,
                    event,
                    role,
                    txHash: result.txId,
                    confirmed: result.confirmed,
                    round: result.round,
                },
                verification: {
                    qrData,
                    verifyUrl: qrData,
                    explorerUrl: `https://testnet.explorer.perawallet.app/tx/${result.txId}`,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  GET /api/chain/cert/verify/:txId  (PUBLIC — no auth required)
// ──────────────────────────────────────────────────────────────
router.get("/verify/:txId", async (req, res, next) => {
    try {
        const { txId } = req.params;

        // 1. Verify on-chain using blockchain service
        const chainVerification = await blockchain.verifyRecord(txId, "certificate");

        // 2. Look up in DB for extra metadata
        let dbCert = null;
        const cert = await Certificate.findOne({ txHash: txId });

        if (cert) {
            let recipientEmail = null;
            if (cert.recipientId) {
                const recipient = await User.findById(cert.recipientId);
                recipientEmail = recipient ? recipient.email : null;
            }

            dbCert = {
                id: cert._id,
                title: cert.title,
                description: cert.description,
                recipientEmail,
                metadata: cert.metadata,
                issuedAt: cert.createdAt,
            };
        }

        // 3. Build response with all verification data
        const record = chainVerification.record;

        res.json({
            verified: chainVerification.valid,

            // On-chain data
            blockchain: {
                txId: chainVerification.txId,
                sender: chainVerification.sender,
                round: chainVerification.round,
                timestamp: chainVerification.timestamp,
                errors: chainVerification.errors,
            },

            // Certificate metadata (from chain note)
            certificate: record
                ? {
                    student: record.data?.student || null,
                    event: record.data?.event || null,
                    role: record.data?.role || null,
                    ipfsHash: record.data?.ipfsHash || null,
                    issuedBy: record.data?.issuedBy || null,
                    issuedAt: record.data?.issuedAt || null,
                    certHash: record.data?.certHash || null,
                }
                : null,

            // DB-enriched data
            database: dbCert,

            // Verification links
            links: {
                explorerUrl: `https://testnet.explorer.perawallet.app/tx/${txId}`,
                qrVerifyUrl: verifyUrl(txId),
                ipfsUrl: record?.data?.ipfsHash
                    ? `https://ipfs.io/ipfs/${record.data.ipfsHash}`
                    : null,
            },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

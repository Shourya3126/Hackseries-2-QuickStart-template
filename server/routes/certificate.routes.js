const express = require("express");
const Joi = require("joi");
const router = express.Router();

const Certificate = require("../models/Certificate");
const validate = require("../middleware/validate");
const { authMiddleware, requireRole } = require("../middleware/auth");
const algorand = require("../services/algorand.service");

// ── Schemas ────────────────────────────────────────────
const mintSchema = Joi.object({
    recipientId: Joi.string().required(),
    title: Joi.string().min(3).max(200).required(),
    issuer: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).allow("").default(""),
    metadata: Joi.object().default({}),
});

// ── POST /api/certificate/mint ─────────────────────────
router.post(
    "/mint",
    authMiddleware,
    requireRole("teacher", "admin"),
    validate(mintSchema),
    async (req, res, next) => {
        try {
            const { recipientId, title, issuer, description, metadata } = req.body;

            // Build NFT metadata
            const nftMetadata = {
                standard: "arc3",
                title,
                issuer,
                description,
                issuedAt: new Date().toISOString(),
                issuedBy: req.user.id,
                ...metadata,
            };

            // Mint on Algorand as ASA
            const { assetId, txId } = await algorand.mintCertificate(
                null, // recipient addr – in demo the master account holds it
                nftMetadata
            );

            // Save to DB
            const certificate = await Certificate.create({
                recipientId,
                title,
                issuer,
                description,
                metadata: nftMetadata,
                assetId,
                txHash: txId,
            });

            res.status(201).json({ certificate });
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/certificate/verify/:assetId ───────────────
router.get("/verify/:assetId", async (req, res, next) => {
    try {
        const cert = await Certificate.findOne({
            assetId: Number(req.params.assetId),
        });
        if (!cert) {
            return res.status(404).json({ error: "Certificate not found" });
        }
        res.json({ verified: true, certificate: cert });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/certificates ──────────────────────────────
router.get("/", authMiddleware, async (req, res, next) => {
    try {
        const certificates = await Certificate.find({
            recipientId: req.user.id,
        }).sort({ createdAt: -1 });
        res.json({ certificates });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

/**
 * Transaction Controller
 *
 * Endpoints:
 *   POST /api/tx/prepare     – Build unsigned transaction → base64
 *   POST /api/tx/broadcast   – Submit signed blob → Algorand TestNet
 *   GET  /api/tx/verify/:txId?type=  – Verify a TrustSphere record
 *   GET  /api/tx/:txId       – Read a transaction + decoded note
 *
 * Security: NO private keys. User signs with Pera Wallet on frontend.
 */
const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/auth");
const blockchain = require("../blockchain/algorand.service");

// ── POST /api/tx/prepare ──────────────────────────────────────
router.post("/prepare", authMiddleware, async (req, res, next) => {
    try {
        const { type, senderAddress, ...rest } = req.body;

        const unsignedTxn = await blockchain.createUnsignedTx(
            { type, data: rest },
            senderAddress
        );

        res.json({
            unsignedTxn,
            txType: type,
            message: "Sign this transaction with your Pera Wallet",
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/tx/broadcast ────────────────────────────────────
router.post("/broadcast", authMiddleware, async (req, res, next) => {
    try {
        const { signedTxn, type } = req.body;

        const result = await blockchain.submitSignedTx(signedTxn);

        res.json({
            txId: result.txId,
            confirmed: result.confirmed,
            round: result.round,
            type,
            message: "Transaction submitted to Algorand TestNet",
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/tx/verify/:txId ──────────────────────────────────
router.get("/verify/:txId", async (req, res, next) => {
    try {
        const type = req.query.type;
        if (!type) {
            return res.status(400).json({ error: "Query param ?type= is required" });
        }

        const result = await blockchain.verifyRecord(req.params.txId, type);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

// ── GET /api/tx/:txId ─────────────────────────────────────────
router.get("/:txId", async (req, res, next) => {
    try {
        const tx = await blockchain.readTx(req.params.txId);
        res.json({ transaction: tx });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

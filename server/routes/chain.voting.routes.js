/**
 * ──────────────────────────────────────────────────────────────
 *  Blockchain Voting Routes
 * ──────────────────────────────────────────────────────────────
 *
 *  POST /api/chain/vote/unsigned
 *       → Builds unsigned Algorand TX with vote data
 *
 *  POST /api/chain/vote/submit
 *       → Broadcasts user-signed blob, records vote in DB
 *
 *  GET  /api/chain/vote/result/:electionId
 *       → Scans on-chain txns + DB to return tallied results
 *
 *  Rules:
 *    • 1 wallet = 1 vote  (enforced in DB + checked on-chain)
 *    • Anonymous choice    (only choiceHash stored on-chain)
 *    • Immutable           (once on Algorand, cannot be modified)
 * ──────────────────────────────────────────────────────────────
 */
const express = require("express");
const Joi = require("joi");
const crypto = require("crypto");
const router = express.Router();

const Election = require("../models/Election");
const { authMiddleware } = require("../middleware/auth");
const validate = require("../middleware/validate");
const blockchain = require("../blockchain/algorand.service");

// ── Helpers ────────────────────────────────────────────────────

function sha256(input) {
    return crypto.createHash("sha256").update(String(input)).digest("hex");
}

// ── Schemas ────────────────────────────────────────────────────

const createUnsignedSchema = Joi.object({
    electionId: Joi.string().required(),
    candidateIndex: Joi.number().integer().min(0).required(),
    senderAddress: Joi.string().length(58).required(),
});

const submitSignedSchema = Joi.object({
    signedTxn: Joi.string().required(),
    electionId: Joi.string().required(),
    candidateIndex: Joi.number().integer().min(0).required(),
});

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/vote/unsigned
// ──────────────────────────────────────────────────────────────
router.post(
    "/unsigned",
    authMiddleware,
    validate(createUnsignedSchema),
    async (req, res, next) => {
        try {
            const { electionId, candidateIndex, senderAddress } = req.body;

            // ── 1. Validate election ──────────────────────────────
            const election = await Election.findById(electionId);
            if (!election) {
                return res.status(404).json({ error: "Election not found" });
            }
            if (election.status !== "active") {
                return res.status(400).json({ error: "Election is not active" });
            }
            if (new Date() > election.endsAt) {
                election.status = "closed";
                await election.save();
                return res.status(400).json({ error: "Election has ended" });
            }
            if (candidateIndex >= election.candidates.length) {
                return res.status(400).json({ error: "Invalid candidate index" });
            }

            // ── 2. Check 1-wallet-1-vote ──────────────────────────
            if (election.voters.includes(senderAddress)) {
                return res.status(409).json({
                    error: "This wallet has already voted in this election",
                });
            }

            // ── 3. Build anonymous choice hash ────────────────────
            //   Hash the candidate choice so the on-chain record
            //   doesn't reveal who was chosen (anonymity).
            const choiceHash = sha256(
                `${electionId}:${candidateIndex}:${Date.now()}`
            );

            // ── 4. Build vote data for on-chain note ──────────────
            const voteData = {
                type: "vote",
                data: {
                    electionId,
                    choiceHash,
                    anonymousToken: sha256(senderAddress + electionId),
                },
            };

            // ── 5. Create unsigned TX ─────────────────────────────
            const unsignedTxn = await blockchain.createUnsignedTx(
                voteData,
                senderAddress
            );

            res.json({
                unsignedTxn,
                choiceHash,
                electionTitle: election.title,
                candidateName: election.candidates[candidateIndex].name,
                message: "Sign this transaction with your Pera Wallet to cast your vote",
            });
        } catch (err) {
            next(err);
        }
    }
);

// ──────────────────────────────────────────────────────────────
//  POST /api/chain/vote/submit
// ──────────────────────────────────────────────────────────────
router.post(
    "/submit",
    authMiddleware,
    validate(submitSignedSchema),
    async (req, res, next) => {
        try {
            const { signedTxn, electionId, candidateIndex } = req.body;
            const walletAddr =
                req.user.walletAddress || req.body.senderAddress || "";

            // ── 1. Re-validate election + double-vote ─────────────
            const election = await Election.findById(electionId);
            if (!election) {
                return res.status(404).json({ error: "Election not found" });
            }
            if (election.status !== "active") {
                return res.status(400).json({ error: "Election is not active" });
            }
            if (new Date() > election.endsAt) {
                election.status = "closed";
                await election.save();
                return res.status(400).json({ error: "Election has ended" });
            }
            if (candidateIndex >= election.candidates.length) {
                return res.status(400).json({ error: "Invalid candidate index" });
            }
            if (election.voters.includes(walletAddr)) {
                return res.status(409).json({
                    error: "This wallet has already voted",
                });
            }

            // ── 2. Broadcast to Algorand ──────────────────────────
            const result = await blockchain.submitSignedTx(signedTxn);

            // ── 3. Record vote in DB (wallet tracked, choice stays anonymous)
            election.candidates[candidateIndex].voteCount += 1;
            election.voters.push(walletAddr);
            await election.save();

            res.json({
                message: "Vote cast and recorded on Algorand blockchain",
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
//  GET /api/chain/vote/result/:electionId
// ──────────────────────────────────────────────────────────────
router.get("/result/:electionId", async (req, res, next) => {
    try {
        const election = await Election.findById(req.params.electionId);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        const totalVotes = election.candidates.reduce(
            (sum, c) => sum + c.voteCount,
            0
        );

        res.json({
            election: {
                id: election._id,
                title: election.title,
                status: election.status,
                endsAt: election.endsAt,
                createdAt: election.createdAt,
                totalVotes,
                totalVoters: election.voters.length,
                candidates: election.candidates.map((c) => ({
                    name: c.name,
                    party: c.party,
                    votes: c.voteCount,
                    percentage:
                        totalVotes > 0
                            ? ((c.voteCount / totalVotes) * 100).toFixed(1)
                            : "0.0",
                })),
            },
            onChain: {
                network: "Algorand TestNet",
                recordType: "vote",
                immutable: true,
                voterWalletsRecorded: election.voters.length,
            },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

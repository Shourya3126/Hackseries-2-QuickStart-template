const express = require("express");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const Election = require("../models/Election");
const validate = require("../middleware/validate");
const { authMiddleware, requireRole } = require("../middleware/auth");
const algorand = require("../services/algorand.service");

// ── Schemas ────────────────────────────────────────────
const createElectionSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    candidates: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                party: Joi.string().allow("").default(""),
            })
        )
        .min(2)
        .required(),
    endsAt: Joi.date().greater("now").required(),
});

const castVoteSchema = Joi.object({
    electionId: Joi.string().required(),
    candidateIndex: Joi.number().integer().min(0).required(),
});

// ── POST /api/election/create ──────────────────────────
router.post(
    "/election/create",
    authMiddleware,
    requireRole("teacher", "admin"),
    validate(createElectionSchema),
    async (req, res, next) => {
        try {
            const election = await Election.create({
                title: req.body.title,
                createdBy: req.user.id,
                status: "active",
                endsAt: req.body.endsAt,
                candidates: req.body.candidates.map((c) => ({
                    name: c.name,
                    party: c.party,
                    voteCount: 0,
                })),
            });

            res.status(201).json({ election });
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/vote/cast ────────────────────────────────
router.post(
    "/vote/cast",
    authMiddleware,
    validate(castVoteSchema),
    async (req, res, next) => {
        try {
            const { electionId, candidateIndex } = req.body;
            const walletAddr = req.user.walletAddress;

            if (!walletAddr) {
                return res.status(400).json({ error: "Wallet not linked. Connect your wallet first." });
            }

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

            // One wallet = one vote
            if (election.voters.includes(walletAddr)) {
                return res.status(409).json({ error: "You have already voted in this election" });
            }

            // Generate anonymous token for on-chain record
            const anonymousToken = uuidv4();

            // Write vote on-chain
            const { txId } = await algorand.castVote(electionId, anonymousToken);

            // Update election
            election.candidates[candidateIndex].voteCount += 1;
            election.voters.push(walletAddr);
            await election.save();

            res.json({
                message: "Vote cast successfully",
                txId,
                anonymousToken,
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/results/:id ───────────────────────────────
router.get("/results/:id", async (req, res, next) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) {
            return res.status(404).json({ error: "Election not found" });
        }

        const totalVotes = election.candidates.reduce((sum, c) => sum + c.voteCount, 0);

        res.json({
            election: {
                title: election.title,
                status: election.status,
                endsAt: election.endsAt,
                totalVotes,
                candidates: election.candidates.map((c) => ({
                    name: c.name,
                    party: c.party,
                    votes: c.voteCount,
                    percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : "0.0",
                })),
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/election/list ─────────────────────────────
router.get("/election/list", authMiddleware, async (req, res, next) => {
    try {
        const elections = await Election.find().sort({ createdAt: -1 });

        const formattedElections = elections.map(e => ({
            id: e._id,
            title: e.title,
            status: e.status,
            endsAt: e.endsAt,
            candidates: e.candidates.map(c => ({
                name: c.name,
                party: c.party,
                votes: c.voteCount
            })),
            voters: e.voters ? e.voters.length : 0
        }));

        res.json({ elections: formattedElections });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

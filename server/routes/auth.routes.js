const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const router = express.Router();

const User = require("../models/User");
const validate = require("../middleware/validate");
const { authMiddleware } = require("../middleware/auth");
const algorand = require("../services/algorand.service");

// ── Schemas ────────────────────────────────────────────
const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("student", "teacher", "admin").required(),
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const linkWalletSchema = Joi.object({
    walletAddress: Joi.string().min(32).required(),
});

// ── Helpers ────────────────────────────────────────────
function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

// ── POST /api/auth/register ────────────────────────────
router.post("/register", validate(registerSchema), async (req, res, next) => {
    try {
        const { email, password, role } = req.body;

        // Check if user already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: "Email already registered" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create Algorand account for this user
        const algoAccount = algorand.createAccount();

        const user = await User.create({
            email,
            passwordHash,
            role,
            walletAddress: algoAccount.addr,
            algorandMnemonic: algoAccount.mnemonic,
        });

        const token = signToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/login ───────────────────────────────
router.post("/login", validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = signToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /api/auth/link-wallet ─────────────────────────
router.post("/link-wallet", authMiddleware, validate(linkWalletSchema), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.walletAddress = req.body.walletAddress;
        await user.save();

        res.json({ message: "Wallet linked", walletAddress: user.walletAddress });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/auth/me ───────────────────────────────────
router.get("/me", authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            const userObj = { ...user };
            delete userObj.passwordHash;
            delete userObj.algorandMnemonic;
            res.json({ user: userObj });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;

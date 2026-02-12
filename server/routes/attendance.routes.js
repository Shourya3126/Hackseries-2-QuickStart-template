const express = require("express");
const Joi = require("joi");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const Session = require("../models/Session");
const User = require("../models/User");
const validate = require("../middleware/validate");
const { authMiddleware, requireRole } = require("../middleware/auth");
const algorand = require("../services/algorand.service");
const ai = require("../services/ai.service");

// ── Schemas ────────────────────────────────────────────
const createSessionSchema = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    location: Joi.object({
        lat: Joi.number().default(0),
        lng: Joi.number().default(0),
        radius: Joi.number().default(100),
    }).default(),
});

const markAttendanceSchema = Joi.object({
    sessionId: Joi.string().required(),
    qrCode: Joi.string().required(),
    selfieBase64: Joi.string().allow("").default(""),
    location: Joi.object({
        lat: Joi.number().default(0),
        lng: Joi.number().default(0),
    }).default(),
});

// ── POST /api/session/create ───────────────────────────
router.post(
    "/session/create",
    authMiddleware,
    requireRole("teacher", "admin"),
    validate(createSessionSchema),
    async (req, res, next) => {
        try {
            const qrSecret = uuidv4();
            const session = await Session.create({
                teacherId: req.user.id,
                title: req.body.title,
                qrSecret,
                qrExpiresAt: new Date(Date.now() + 60_000), // 60 s
                location: req.body.location,
            });

            // Start QR rotation via Socket.io (if available)
            const io = req.app.get("io");
            if (io) {
                const interval = setInterval(() => {
                    const newSecret = uuidv4();
                    Session.findByIdAndUpdate(session._id, {
                        qrSecret: newSecret,
                        qrExpiresAt: new Date(Date.now() + 60_000),
                    }).exec();
                    io.to(`session:${session._id}`).emit("qr:refresh", {
                        sessionId: session._id,
                        qrCode: newSecret,
                        expiresAt: new Date(Date.now() + 60_000),
                    });
                }, 60_000);

                // Store interval so we can clear it later
                req.app.get("sessionIntervals")?.set(session._id.toString(), interval);
            }

            res.status(201).json({
                session: {
                    id: session._id,
                    title: session.title,
                    qrCode: qrSecret,
                    expiresAt: session.qrExpiresAt,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/attendance/mark ──────────────────────────
router.post(
    "/attendance/mark",
    authMiddleware,
    requireRole("student"),
    validate(markAttendanceSchema),
    async (req, res, next) => {
        try {
            const { sessionId, qrCode, selfieBase64 } = req.body;

            // 1. Find session & validate QR
            const session = await Session.findById(sessionId);
            if (!session || !session.active) {
                return res.status(404).json({ error: "Session not found or inactive" });
            }
            if (session.qrSecret !== qrCode || new Date() > session.qrExpiresAt) {
                return res.status(400).json({ error: "QR code expired or invalid" });
            }

            // 2. Check duplicate
            const alreadyMarked = session.attendees.some(
                (a) => a.studentId.toString() === req.user.id
            );
            if (alreadyMarked) {
                return res.status(409).json({ error: "Attendance already marked" });
            }

            // 3. Liveness check (stub)
            const liveness = ai.checkLiveness(selfieBase64);
            if (!liveness.alive) {
                return res.status(400).json({ error: "Liveness check failed" });
            }

            // 4. Write to Algorand
            const { txId } = await algorand.writeAttendance(
                sessionId,
                req.user.id,
                new Date().toISOString()
            );

            // 5. Save attendee
            session.attendees.push({
                studentId: req.user.id,
                txId,
            });
            await session.save();

            res.json({
                message: "Attendance marked successfully",
                txId,
                liveness,
            });
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/attendance/history ────────────────────────
// ── GET /api/attendance/history ────────────────────────
router.get("/attendance/history", authMiddleware, async (req, res, next) => {
    try {
        let sessions;
        if (req.user.role === "teacher" || req.user.role === "admin") {
            const rawSessions = await Session.find({ teacherId: req.user.id }).sort({ createdAt: -1 });

            // Manually populate attendees
            sessions = await Promise.all(rawSessions.map(async (s) => {
                const sObj = { ...s };
                if (s.attendees && s.attendees.length > 0) {
                    sObj.attendees = await Promise.all(s.attendees.map(async (a) => {
                        if (a.studentId) {
                            const student = await User.findById(a.studentId);
                            return {
                                ...a,
                                studentId: student ? { _id: student._id, email: student.email, walletAddress: student.walletAddress } : null
                            };
                        }
                        return a;
                    }));
                }
                return sObj;
            }));

        } else {
            const rawSessions = await Session.find({ "attendees.studentId": req.user.id }).sort({ createdAt: -1 });
            // Manually select fields
            sessions = rawSessions.map(s => ({
                _id: s._id,
                title: s.title,
                createdAt: s.createdAt,
                attendees: s.attendees
            }));
        }
        res.json({ sessions });
    } catch (err) {
        next(err);
    }
});

// ── GET /api/attendance/verify/:tx ─────────────────────
router.get("/attendance/verify/:tx", async (req, res, next) => {
    try {
        const txInfo = await algorand.lookupTransaction(req.params.tx);
        if (!txInfo) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        res.json({ verified: true, transaction: txInfo });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

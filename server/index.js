require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const { Server: SocketServer } = require("socket.io");

// const connectDB = require("./config/db"); // Removed

const rateLimiter = require("./middleware/rateLimiter");

// ── Route imports ──────────────────────────────────────
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const votingRoutes = require("./routes/voting.routes");
const complaintRoutes = require("./routes/complaint.routes");
const certificateRoutes = require("./routes/certificate.routes");
const txRoutes = require("./routes/tx.routes");
const chainAttendanceRoutes = require("./routes/chain.attendance.routes");
const chainVotingRoutes = require("./routes/chain.voting.routes");
const chainCertificateRoutes = require("./routes/chain.certificate.routes");
const chainComplaintRoutes = require("./routes/chain.complaint.routes");

// ── App setup ──────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Socket.io
const io = new SocketServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        methods: ["GET", "POST"],
    },
});
app.set("io", io);
app.set("sessionIntervals", new Map());

// Socket.io connection handler
io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a session room (for QR refresh)
    socket.on("session:join", (sessionId) => {
        socket.join(`session:${sessionId}`);
        console.log(`  → ${socket.id} joined session:${sessionId}`);
    });

    socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// ── Middleware ──────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        credentials: true,
    })
);
app.use(express.json({ limit: "5mb" })); // for selfie base64
app.use(rateLimiter);

// ── Health check ───────────────────────────────────────
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", attendanceRoutes); // /api/session/create, /api/attendance/*
app.use("/api", votingRoutes); // /api/election/create, /api/vote/cast, /api/results/:id
app.use("/api/complaint", complaintRoutes);
app.use("/api/complaints", complaintRoutes); // alias for GET
app.use("/api/certificate", certificateRoutes);
app.use("/api/certificates", certificateRoutes); // alias for GET
app.use("/api/tx", txRoutes);
app.use("/api/chain/attendance", chainAttendanceRoutes);
app.use("/api/chain/vote", chainVotingRoutes);
app.use("/api/chain/cert", chainCertificateRoutes);
app.use("/api/chain/complaint", chainComplaintRoutes);

// ── Global error handler ───────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("❌ Unhandled error:", err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    });
});

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// connectDB().then(() => {
server.listen(PORT, () => {
    console.log(`🚀 TrustSphere server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io listening`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
// });

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * JWT authentication middleware.
 * Expects header: Authorization: Bearer <token>
 * Attaches req.user = { id, role, walletAddress }
 */
async function authMiddleware(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        req.user = {
            id: user._id.toString(),
            role: user.role,
            walletAddress: user.walletAddress,
            email: user.email,
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
}

/**
 * Role-based access control middleware factory.
 * Usage: requireRole("teacher", "admin")
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}

module.exports = { authMiddleware, requireRole };

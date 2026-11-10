
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in .env file");

            return res.status(500).json({
                message: "Authentication configuration error"
            });
        }

        // Get token from request header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. No token provided."
            });
        }

        // Extract token
        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                message: "Access denied. Invalid token."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Validate decoded user information
        if (
            !decoded.userId ||
            !["customer", "staff", "admin"].includes(decoded.role)
        ) {
            return res.status(401).json({
                message: "Invalid authentication token"
            });
        }

        // Store authenticated user information
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();

    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        console.error("Authentication Error:", error.message);

        return res.status(500).json({
            message: "Authentication server error"
        });
    }
};

module.exports = authMiddleware;

// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { setUser as setSentryUser } from "../utils/sentry.js";
dotenv.config();

/**
 * verifyToken middleware
 * - Expects 'Authorization: Bearer <token>' header
 * - Verifies JWT using process.env.JWT_SECRET
 * - On success attaches req.userEmail
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("Missing JWT_SECRET in environment");
      return res.status(500).json({ message: "Server configuration error" });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Expect token to include email
      req.userEmail = decoded.email;
      
      // Set Sentry user context for error tracking
      setSentryUser({
        email: decoded.email,
        id: decoded.id || decoded.userId,
      });
      
      next();
    });
  } catch (err) {
    console.error("verifyToken error:", err);
    res.status(500).json({ message: "Token verification error" });
  }
};

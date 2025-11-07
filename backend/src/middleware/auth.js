// backend/src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findByPk(decoded.id, {
        attributes: ["id", "name", "email"],
      });

      if (!req.user) {
        return res.status(401).json({ success: false, message: "User not found" });
      }

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  } else {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
};

// ✅ Alias for compatibility with older code
export const verifyToken = protect;

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
    const header = req.headers.authorization;

    const match = typeof header === "string"
        ? header.match(/^Bearer +(\S+)\s*$/i)
        : null;

    if (!match) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const token = match[1];

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        console.error("Auth failed:", error.message);
        return res.status(401).json({ message: "Not authorized" });
    }

    let user;
    try {
        user = await User.findById(payload.id);
    } catch (error) {
        return next(error);
    }

    if (!user) {
        return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
}
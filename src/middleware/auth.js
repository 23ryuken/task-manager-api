import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authorized" });
    }

    const token = header.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth failed:", error.message);
        return res.status(401).json({ message: "Not authorized" });
    }
}
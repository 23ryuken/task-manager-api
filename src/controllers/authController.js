import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function register(req, res) {
    try {
        const { name, email, password } = req.body || {};

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res
                .status(400)
                .json({ message: "Name, email and password must be text" });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res
                .status(400)
                .json({ message: "Please provide a valid email address" });
        }

        if (password.length < 8) {
            return res
                .status(400)
                .json({ message: "Password must be at least 8 characters long" });
        }

        const existing = await User.findOne({ email: cleanEmail });
        if (existing) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        const user = await User.create({
            name: cleanName,
            email: cleanEmail,
            password,
        });

        return res.status(201).json({
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(", ") });
        }

        if (error.code === 11000) {
            return res.status(409).json({ message: "Email is already registered" });
        }

        console.error("Register failed:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        if (typeof email !== "string" || typeof password !== "string") {
            return res
                .status(400)
                .json({ message: "Email and password must be text" });
        }

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail || !password) {
            return res
                .status(400)
                .json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: cleanEmail }).select("+password");

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}
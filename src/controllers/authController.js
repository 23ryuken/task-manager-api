import User from "../models/User.js"

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

        const user = await User.create({ name, email, password });

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
import Task from "../models/Task.js";

export async function createTask(req, res) {
    try {
        const { title, description, status } = req.body || {};

        if (typeof title !== "string") {
            return res.status(400).json({ message: "Title must be text" });
        }

        if (
            (description !== undefined && typeof description !== "string") ||
            (status !== undefined && typeof status !== "string")
        ) {
            return res
                .status(400)
                .json({ message: "Description and status must be text if provided" });
        }

        const task = await Task.create({
            title,
            description,
            status,
            owner: req.user._id,
        });

        return res.status(201).json({
            task: {
                id: task._id,
                title: task.title,
                description: task.description,
                status: task.status,
                owner: task.owner,
            },
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: messages.join(", ") });
        }

        console.error("Creating task failed:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}

export async function getTasks(req, res) {
    try {
        const tasks = await Task.find({ owner: req.user._id }).sort({
            createdAt: -1,
        });

        return res.status(200).json({ tasks });
    } catch (error) {
        console.error("Listing tasks failed:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
}
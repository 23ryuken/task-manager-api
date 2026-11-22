import express from "express";
import { createTask, getTasks, getTask, updateTask } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", createTask);
router.get("/", getTasks);
router.get("/", getTask);
router.patch("/:id", updateTask);

export default router;
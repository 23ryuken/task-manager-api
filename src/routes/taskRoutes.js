import express from "express";
import { createTask, getTasks } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", createTask);
router.get("/", getTasks);

export default router;
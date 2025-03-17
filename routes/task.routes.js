import express from "express"
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getScheduledTasks,
} from "../controllers/task.controller.js"
import { authenticate } from "../middleware/auth.middleware.js"

const router = express.Router()

// Apply authentication middleware to all task routes
router.use(authenticate)

router.post("/", createTask)
router.get("/", getTasks)
router.get("/scheduled", getScheduledTasks)
router.get("/:id", getTaskById)
router.put("/:id", updateTask)
router.delete("/:id", deleteTask)

export default router


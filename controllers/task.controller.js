import Task from "../models/task.model.js"
import { redisClient } from "../utils/redis.js"
import { PriorityQueue } from "../utils/priorityQueue.js"

// Create a new task
export const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status } = req.body

    const task = new Task({
      title,
      description,
      priority: priority || "medium",
      status: status || "pending",
      user: req.userId,
    })

    await task.save()

    // Invalidate cache for this user's tasks
    await redisClient.del(`tasks:${req.userId}`)

    res.status(201).json({
      message: "Task created successfully",
      task,
    })
  } catch (error) {
    next(error)
  }
}

// Get all tasks with pagination and filtering
export const getTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query
    const skip = (page - 1) * limit

    // Build filter
    const filter = { user: req.userId }
    if (status) filter.status = status
    if (priority) filter.priority = priority

    // Create cache key based on query parameters
    const cacheKey = `tasks:${req.userId}:${JSON.stringify(filter)}:${page}:${limit}`

    // Try to get from cache first
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData))
    }
    console.log("cache not found fetching from db ");
    
    // If not in cache, query database
    const tasks = await Task.find(filter).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(Number.parseInt(limit))

    const total = await Task.countDocuments(filter)

    const result = {
      tasks,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      totalTasks: total,
    }

    // Store in cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(result), "EX", 300)

    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

// Get task by ID
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId,
    })

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    res.status(200).json(task)
  } catch (error) {
    next(error)
  }
}

// Update task
export const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, status } = req.body

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { title, description, priority, status },
      { new: true, runValidators: true },
    )

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Invalidate cache for this user's tasks
    await redisClient.del(`tasks:${req.userId}`)

    res.status(200).json({
      message: "Task updated successfully",
      task,
    })
  } catch (error) {
    next(error)
  }
}

// Delete task
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    })

    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Invalidate cache for this user's tasks
    await redisClient.del(`tasks:${req.userId}`)

    res.status(200).json({
      message: "Task deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

// Get scheduled tasks using priority queue
export const getScheduledTasks = async (req, res, next) => {
  try {
    // Get all tasks for the user
    const tasks = await Task.find({
      user: req.userId,
      status: "pending",
    })

    // Create priority queue
    const priorityQueue = new PriorityQueue()

    // Add tasks to priority queue
    tasks.forEach((task) => {
      // Calculate priority score (higher for high priority and newer tasks)
      let priorityScore = 0

      switch (task.priority) {
        case "high":
          priorityScore += 100
          break
        case "medium":
          priorityScore += 50
          break
        case "low":
          priorityScore += 10
          break
      }

      // Add recency factor (newer tasks get higher priority)
      const ageInHours = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60)
      priorityScore -= ageInHours // Reduce score for older tasks

      priorityQueue.enqueue(task, priorityScore)
    })

    // Extract tasks in priority order
    const scheduledTasks = []
    while (!priorityQueue.isEmpty()) {
      scheduledTasks.push(priorityQueue.dequeue().element)
    }

    res.status(200).json({
      scheduledTasks,
    })
  } catch (error) {
    next(error)
  }
}


import request from "supertest"
import mongoose from "mongoose"
import app from "../app.js"
import User from "../models/user.model.js"
import Task from "../models/task.model.js"
import jwt from "jsonwebtoken"
import { expect } from "@jest/globals"

// Mock Redis client
jest.mock("../utils/redis.js", () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
    on: jest.fn(),
  },
}))

describe("Task API", () => {
  let testUser
  let token
  let taskId

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST)

    // Clear collections
    await User.deleteMany({})
    await Task.deleteMany({})

    // Create test user
    const user = new User({
      username: "taskuser",
      email: "taskuser@example.com",
      password: "password123",
    })

    testUser = await user.save()

    // Generate token
    token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
  })

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close()
  })

  describe("POST /api/tasks", () => {
    it("should create a new task", async () => {
      const res = await request(app).post("/api/tasks").set("Authorization", `Bearer ${token}`).send({
        title: "Test Task",
        description: "This is a test task",
        priority: "high",
        status: "pending",
      })

      expect(res.statusCode).toEqual(201)
      expect(res.body).toHaveProperty("task")
      expect(res.body.task.title).toEqual("Test Task")
      expect(res.body.task.priority).toEqual("high")

      // Save task ID for later tests
      taskId = res.body.task._id
    })

    it("should not create a task without authentication", async () => {
      const res = await request(app).post("/api/tasks").send({
        title: "Unauthorized Task",
        description: "This should fail",
        priority: "medium",
      })

      expect(res.statusCode).toEqual(401)
    })
  })

  describe("GET /api/tasks", () => {
    it("should get all tasks for the user", async () => {
      const res = await request(app).get("/api/tasks").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("tasks")
      expect(Array.isArray(res.body.tasks)).toBeTruthy()
      expect(res.body.tasks.length).toBeGreaterThan(0)
    })

    it("should filter tasks by priority", async () => {
      const res = await request(app).get("/api/tasks?priority=high").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body.tasks.every((task) => task.priority === "high")).toBeTruthy()
    })
  })

  describe("GET /api/tasks/:id", () => {
    it("should get a task by ID", async () => {
      const res = await request(app).get(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("_id")
      expect(res.body.title).toEqual("Test Task")
    })

    it("should not get a non-existent task", async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const res = await request(app).get(`/api/tasks/${fakeId}`).set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(404)
    })
  })

  describe("PUT /api/tasks/:id", () => {
    it("should update a task", async () => {
      const res = await request(app).put(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`).send({
        title: "Updated Task",
        description: "This task has been updated",
        priority: "medium",
        status: "completed",
      })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("task")
      expect(res.body.task.title).toEqual("Updated Task")
      expect(res.body.task.status).toEqual("completed")
    })
  })

  describe("GET /api/tasks/scheduled", () => {
    it("should get scheduled tasks in priority order", async () => {
      // Create more tasks with different priorities
      await Task.create({
        title: "Low Priority Task",
        description: "Low priority task",
        priority: "low",
        status: "pending",
        user: testUser._id,
      })

      await Task.create({
        title: "Medium Priority Task",
        description: "Medium priority task",
        priority: "medium",
        status: "pending",
        user: testUser._id,
      })

      const res = await request(app).get("/api/tasks/scheduled").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("scheduledTasks")
      expect(Array.isArray(res.body.scheduledTasks)).toBeTruthy()

      // Check if tasks are ordered by priority
      const tasks = res.body.scheduledTasks
      for (let i = 0; i < tasks.length - 1; i++) {
        const currentPriority = tasks[i].priority
        const nextPriority = tasks[i + 1].priority

        // Convert priority to numeric value for comparison
        const priorityValues = { high: 3, medium: 2, low: 1 }
        expect(priorityValues[currentPriority] >= priorityValues[nextPriority]).toBeTruthy()
      }
    })
  })

  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      const res = await request(app).delete(`/api/tasks/${taskId}`).set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("message")

      // Verify task is deleted
      const checkTask = await Task.findById(taskId)
      expect(checkTask).toBeNull()
    })
  })
})


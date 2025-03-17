import request from "supertest"
import mongoose from "mongoose"
import app from "../app.js"
import User from "../models/user.model.js"
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

describe("Auth API", () => {
  let testUser
  let token

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST)

    // Clear users collection
    await User.deleteMany({})
  })

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.close()
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toEqual(201)
      expect(res.body).toHaveProperty("token")
      expect(res.body).toHaveProperty("user")
      expect(res.body.user).toHaveProperty("id")
      expect(res.body.user.username).toEqual("testuser")
      expect(res.body.user.email).toEqual("test@example.com")

      // Save user for later tests
      testUser = res.body.user
      token = res.body.token
    })

    it("should not register a user with existing email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        username: "anotheruser",
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toEqual(400)
      expect(res.body).toHaveProperty("message")
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login an existing user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      })

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("token")
      expect(res.body).toHaveProperty("user")
      expect(res.body.user.email).toEqual("test@example.com")
    })

    it("should not login with incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      })

      expect(res.statusCode).toEqual(401)
      expect(res.body).toHaveProperty("message")
    })
  })

  describe("GET /api/auth/me", () => {
    it("should get current user profile", async () => {
      const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`)

      expect(res.statusCode).toEqual(200)
      expect(res.body).toHaveProperty("_id")
      expect(res.body.email).toEqual("test@example.com")
    })

    it("should not get profile without token", async () => {
      const res = await request(app).get("/api/auth/me")

      expect(res.statusCode).toEqual(401)
    })
  })
})


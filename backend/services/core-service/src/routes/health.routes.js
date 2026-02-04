import express from "express";
import pool from "../db/database.js";

// Create a router for health-related endpoints
const router = express.Router();

// Basic health check (service is running)
router.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "core-service" });
});

// Database health check (service can query PostgreSQL)
router.get("/db", async (_req, res, next) => {
  try {
    // Simple query to verify DB connectivity
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    // Forward errors to the global error handler
    next(error);
  }
});

// Export router to mount in app
export default router;

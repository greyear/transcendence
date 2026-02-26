import express from "express";
import cors from "cors";
import { optionalAuth } from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 3000;

// Service URLs from environment variables
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://core-service:3002";

app.use(cors());
app.use(express.json());

// API Gateway Architecture:
// 1. optionalAuth middleware validates JWT tokens from Authorization header
// 2. If token is valid, stores userId in req.userId
// 3. All downstream routes receive req.userId (from auth-service validation)
// 4. Each route forwards X-User-Id header to microservices with req.userId
// This way, other services get user context without validating token themselves
app.use(optionalAuth);

// Proxy GET /health to core-service
app.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/health`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch health from core-service" });
  }
});

// Proxy GET /health/db to core-service
app.get("/health/db", async (req, res) => {
  try {
    const response = await fetch(`${CORE_SERVICE_URL}/health/db`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch health/db from core-service" });
  }
});

// Proxy GET /recipes to core-service
app.get("/recipes", async (req, res) => {
  try {
    // Forward X-User-Id header to core-service if user is authenticated
    const headers = {};
    if (req.userId) {
      headers['X-User-Id'] = req.userId.toString();
    }
    
    const response = await fetch(`${CORE_SERVICE_URL}/recipes`, { headers });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipes from core-service" });
  }
});

// Proxy GET /recipes/:id to core-service
app.get("/recipes/:id", async (req, res) => {
  try {
    // Forward X-User-Id header to core-service if user is authenticated
    const headers = {};
    if (req.userId) {
      headers['X-User-Id'] = req.userId.toString();
    }
    
    const response = await fetch(`${CORE_SERVICE_URL}/recipes/${req.params.id}`, { headers });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying to core-service:", error);
    res.status(500).json({ error: "Failed to fetch recipe from core-service" });
  }
});

app.listen(port, () => {
  console.log(`api-gateway listening on port ${port}`);
});

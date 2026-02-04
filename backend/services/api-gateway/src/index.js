import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

// Service URLs from environment variables
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || "http://core-service:3002";

app.use(cors());
app.use(express.json());

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
    const response = await fetch(`${CORE_SERVICE_URL}/recipes`);
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
    const response = await fetch(`${CORE_SERVICE_URL}/recipes/${req.params.id}`);
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

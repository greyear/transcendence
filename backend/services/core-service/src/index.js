import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.routes.js";
import recipesRoutes from "./routes/recipes.routes.js";

// Create Express app instance
const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/health", healthRoutes);
app.use("/recipes", recipesRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup
app.listen(port, () => {
	console.log(`core-service listening on port ${port}`);
});

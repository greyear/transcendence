/**
 * Core Service Entry Point
 *
 * Server startup only - all configuration is in app.ts.
 * This allows testing the app without starting a real server.
 */

import { app } from "./app.js";

// PORT from environment variable or default 3002
const PORT: number = parseInt(process.env.PORT || "3002", 10);

// Start server
app.listen(PORT, () => {
	console.log(`Core service running on port ${PORT}`);
});

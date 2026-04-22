/**
 * API Gateway Entry Point
 *
 * Server startup only - all configuration is in app.ts.
 * This allows testing the app without starting a real server.
 */

import { app } from "./app.js";

// PORT_GATEWAY from environment variable or default 3000
const port = process.env.PORT_GATEWAY || 3000;

// Start server
app.listen(port, () => {
	console.log(`api-gateway listening on port ${port}`);
});

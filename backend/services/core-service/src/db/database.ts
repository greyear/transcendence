/**
 * Database Connection Pool
 * 
 * TypeScript benefits:
 * - Type-safe config parameters (host, port, database are all strings)
 * - Pool typed from pg library (has query, release methods etc.)
 * - Guarantees pool methods are used correctly
 */

import { Pool, QueryResult } from "pg";
import "dotenv/config";

// Pool - Postgres database connection pool
// Reads config from environment variables (with fallback values)
// If DATABASE_URL is set (common in Docker), it takes priority
export const pool: Pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.POSTGRES_HOST || "localhost",
      // parseInt() converts string to number (port must be a number)
      port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
      database: process.env.POSTGRES_DB || "recipes_db",
      user: process.env.POSTGRES_USER || "postgres",
      password: process.env.POSTGRES_PASSWORD || "postgres",
    });

// Fires when a client connects successfully
pool.on("connect", () => {
  console.log("✓ Connected to PostgreSQL database");
});

// Handle errors if something fails in the database pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1); // Stop the application
});

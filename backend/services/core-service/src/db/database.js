import pkg from "pg";
// Use pg Pool to manage multiple reusable DB connections
const { Pool } = pkg;

const pool = new Pool({
  // DATABASE_URL is provided by docker-compose
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  // Fires when a client connects successfully
  console.log("✓ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  // If the pool encounters an idle error, crash so Docker can restart
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Export the pool for queries in routes/services
export default pool;

import express from "express";
import "dotenv/config";
import { authRouter } from "./src/auth_db_operations.js";
import { authGetSet } from "./src/authGetSet.js";
import * as help from "./src/authHelpers.js";

const app = express();

// Parse incoming JSON requests automatically
//https://www.geeksforgeeks.org/node-js/getting-started-with-express-js/
app.use(express.json());

app.use(authRouter);
app.use("/auth", authGetSet);

// Error handler LAST
app.use(help.errorHandler);

//Connection port
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

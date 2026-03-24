import express from "express";
import { authRouter } from "./src/auth_db_operations.ts";
import { authGetSet } from "./src/authGetSet.ts";

const app = express();

// Parse incoming JSON requests automatically
//https://www.geeksforgeeks.org/node-js/getting-started-with-express-js/
app.use(express.json());

app.use(authRouter);
app.use(authGetSet);

//Connection port
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});

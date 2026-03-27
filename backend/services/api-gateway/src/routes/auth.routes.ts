/**
 * Auth Routes
 *
 */

import { type RequestHandler, Router } from "express";

// Auth router
export const authRouter = Router();

const AUTH_SERVICE_URL =
	process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

const postUserRegisterHandler: RequestHandler = async (req, res, _next) => {
	try {
		console.log("Enter handler");
		const response = await fetch(
			`${AUTH_SERVICE_URL}/register`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			}
		);
		console.log(response);
		const data = await response.json();
		console.log(data);
		res.status(response.status).json(data);
	} catch (error) {
		console.log("Error happened");
		}
};

authRouter.post("/register", postUserRegisterHandler);

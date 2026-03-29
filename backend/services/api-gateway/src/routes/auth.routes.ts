/**
 * Auth Routes
 *
 */

import {
	type NextFunction,
	type Request,
	type RequestHandler,
	type Response,
	Router,
} from "express";

// Auth router
export const authRouter = Router();

const AUTH_SERVICE_URL =
	process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

const postAuthRegisterHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		console.log("Enter register handler");
		const response = await fetch(`${AUTH_SERVICE_URL}/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: req.body,
		});
		console.log(response);
		const data = await response.json();
		console.log(data);
		res.status(response.status).json(data);
	} catch (error) {
		console.log("Error happened within regsiter handler");
	}
};

const postLoginHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		console.log("Enter login handler");
		const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: req.body,
		});
		console.log(response);
		const data = await response.json();
		console.log(data);
		res.status(response.status).json(data);
	} catch (error) {
		console.log("Error happened within login handler");
	}
};

const postGoogleHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		console.log("Enter google handler");
		const response = await fetch(`${AUTH_SERVICE_URL}/google`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: req.body,
		});
		console.log(response);
		const data = await response.json();
		console.log(data);
		res.status(response.status).json(data);
	} catch (error) {
		console.log("Error happened within google handler");
	}
};

authRouter.post("/register", postAuthRegisterHandler);
authRouter.post("/login", postLoginHandler);
authRouter.post("/google", postGoogleHandler);

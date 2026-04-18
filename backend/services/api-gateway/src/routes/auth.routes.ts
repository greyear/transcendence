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
import z from "zod";

// Auth router
export const authRouter = Router();

const tokenResponseSchema = z.object({ token: z.string() });

const AUTH_SERVICE_URL =
	process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

const postAuthRegisterHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const response = await fetch(`${AUTH_SERVICE_URL}/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(req.body),
		});
		const data = await response.json();

		if (
			response.status === 201 &&
			tokenResponseSchema.safeParse(data).success
		) {
			const setCookieHeader = response.headers.get("set-cookie");
			if (setCookieHeader) {
				res.set("Set-Cookie", setCookieHeader);
			}
		}

		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const postLoginHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const response = await fetch(`${AUTH_SERVICE_URL}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(req.body),
		});
		const data = await response.json();

		// Forward Set-Cookie headers from auth service to client
		const setCookieHeader = response.headers.get("set-cookie");
		if (setCookieHeader) {
			res.set("Set-Cookie", setCookieHeader);
		}

		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const postGoogleHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		// Forward Authorization header if present
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}
		const response = await fetch(`${AUTH_SERVICE_URL}/google`, {
			method: "POST",
			headers,
			body: JSON.stringify(req.body),
		});
		const data = await response.json();

		// Forward Set-Cookie headers from auth service to client
		const setCookieHeader = response.headers.get("set-cookie");
		if (setCookieHeader) {
			res.set("Set-Cookie", setCookieHeader);
		}

		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const postValidateHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		// Forward Authorization header if present
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}
		const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
			method: "POST",
			headers,
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const deleteUserHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		// Forward Authorization header if present
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}
		const response = await fetch(`${AUTH_SERVICE_URL}/delete`, {
			method: "DELETE",
			headers,
			body: JSON.stringify(req.body),
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const patchChangePasswordHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		// Forward Authorization header if present
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}
		const response = await fetch(`${AUTH_SERVICE_URL}/change-password`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(req.body),
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const getMeHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}
		const response = await fetch(`${AUTH_SERVICE_URL}/me`, {
			method: "GET",
			headers,
		});
		const data = await response.json();
		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

const postLogoutHandler: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		if (req.headers.authorization) {
			headers.authorization = req.headers.authorization;
		}

		const response = await fetch(`${AUTH_SERVICE_URL}/logout`, {
			method: "POST",
			headers,
			body: JSON.stringify(req.body),
		});
		const data = await response.json();

		const setCookieHeader = response.headers.get("set-cookie");
		if (setCookieHeader) {
			res.set("Set-Cookie", setCookieHeader);
		}

		res.status(response.status).json(data);
	} catch (error) {
		next(error);
	}
};

//auth_db_operations.ts handlers
authRouter.post("/register", postAuthRegisterHandler);
authRouter.post("/login", postLoginHandler);
authRouter.post("/google", postGoogleHandler);
authRouter.post("/logout", postLogoutHandler);

//authGetSet.ts handlers
authRouter.post("/validate", postValidateHandler);
authRouter.get("/me", getMeHandler);
authRouter.delete("/delete", deleteUserHandler);
authRouter.patch("/change-password", patchChangePasswordHandler);

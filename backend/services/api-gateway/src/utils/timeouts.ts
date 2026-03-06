import { RequestHandler } from "express";

const parseTimeoutMs = (value: string | undefined, fallbackMs: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallbackMs;
  }

  return parsed;
};

export const GATEWAY_RESPONSE_TIMEOUT_MS = parseTimeoutMs(
  process.env.GATEWAY_RESPONSE_TIMEOUT_MS,
  30000
);

export const CORE_SERVICE_TIMEOUT_MS = parseTimeoutMs(
  process.env.CORE_SERVICE_TIMEOUT_MS,
  25000
);

export const CORE_HEALTH_TIMEOUT_MS = parseTimeoutMs(
  process.env.CORE_HEALTH_TIMEOUT_MS,
  15000
);

export const AUTH_SERVICE_TIMEOUT_MS = parseTimeoutMs(
  process.env.AUTH_SERVICE_TIMEOUT_MS,
  12000
);

export const createResponseTimeoutMiddleware = (
  timeoutMs: number
): RequestHandler => {
  return (req, res, next) => {
    res.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(504).json({ error: "Gateway Timeout" });
      }
    });

    next();
  };
};

export const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  return AbortSignal.timeout(timeoutMs);
};

export const isTimeoutError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
};

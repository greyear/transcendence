// Optional authentication middleware for API Gateway
// Checks if user is authenticated and adds X-User-Id header for downstream services

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

/**
 * Optional authentication middleware
 * - If Authorization header exists, validates token with auth-service
 * - If valid, stores userId in req.userId
 * - If no token or invalid, continues as guest (req.userId = null)
 * - Never blocks the request
 */
export const optionalAuth = async (req, res, next) => {
  try {
    // Extract token from Authorization header (format: "Bearer <token>", standard RFC 6750 (OAuth 2.0))
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided - continue as guest
      req.userId = null;
      return next();
    }

    const token = authHeader.split(" ")[1]; // Remove "Bearer " prefix

    // Validate token with auth-service
    // Note: Auth-service validates the token once here, then we pass userId via headers
    // to downstream microservices instead of making them validate the token again
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Store userId from auth-service response
        // TODO: Coordinate with auth-service team on field name (currently expecting 'id')
        // This userId will be passed to downstream microservices via X-User-Id header
        // Gateway validates token once, then other services use userId instead of token
        // This improves security (token not shared) and performance (no extra validations)
        req.userId = data.id;
      } else {
        // Invalid token - continue as guest
        console.warn("Invalid token, continuing as guest");
        req.userId = null;
      }
    } catch (authError) {
      // Auth-service unavailable - continue as guest
      console.error("Auth-service error:", authError.message);
      req.userId = null;
    }

    next();
  } catch (error) {
    // Unexpected error - continue as guest
    console.error("Error in optionalAuth middleware:", error);
    req.userId = null;
    next();
  }
};

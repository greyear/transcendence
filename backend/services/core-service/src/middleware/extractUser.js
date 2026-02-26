// Middleware to extract userId from X-User-Id header (set by API Gateway)

/**
 * Extract userId from request headers
 * API Gateway adds X-User-Id header after validating the token
 * If header exists, user is authenticated
 * If header doesn't exist, user is a guest
 */
export const extractUser = (req, res, next) => {
  // Get X-User-Id from headers (case-insensitive)
  const userId = req.headers['x-user-id'];
  
  // Parse to integer if exists, otherwise null (guest)
  req.userId = userId ? parseInt(userId, 10) : null;
  
  next();
};

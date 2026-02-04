// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Logs full error stack for debugging
  console.error(err.stack);

  // Use custom statusCode/message if set; otherwise default to 500
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: {
      message,
      // Include stack trace only in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

// 404 handler when no route matches the request
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: "Route not found",
    },
  });
};

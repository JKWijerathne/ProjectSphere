// Standardized API response utilities

// Send success response with status code and data
export const sendResponse = (res, statusCode, data) => {
  res.status(statusCode).json(data);
};

// Send error response with message and status code
export const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

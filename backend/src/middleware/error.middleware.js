import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // MongoDB duplicate key error handling
  if (err.code === 11000) {
    const key = Object.keys(err.keyValue)[0];
    const value = err.keyValue[key];
    error = new ApiError(409, `A record with this ${key} (${value}) already exists.`);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(error.existing && { existing: error.existing }),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  return res.status(error.statusCode || 500).json(response);
};

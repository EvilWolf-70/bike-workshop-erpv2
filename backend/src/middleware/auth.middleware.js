import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ENV } from "../config/env.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, token missing");
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      throw new ApiError(401, "Not authorized, user not found");
    }
    next();
  } catch (error) {
    throw new ApiError(401, "Not authorized, token invalid or expired");
  }
});

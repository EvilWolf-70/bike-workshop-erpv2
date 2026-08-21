import { ApiError } from "../utils/ApiError.js";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `User role '${req.user?.role}' is not authorized to perform this action`);
    }
    next();
  };
};

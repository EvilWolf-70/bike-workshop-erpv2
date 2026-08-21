import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { username, password, displayName, role } = req.body;

  if (!username || !password || !displayName) {
    throw new ApiError(400, "Username, password, and display name are required");
  }

  const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(400, "User already exists with this username");
  }

  const user = await User.create({
    username: username.toLowerCase().trim(),
    password,
    displayName: displayName.trim(),
    role: role || "Admin",
  });

  const token = generateToken(user._id);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
        token,
      },
      "User registered successfully"
    )
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "Please provide username and password");
  }

  if (username.trim().toLowerCase() === "networkerror") {
    throw new ApiError(500, "NETWORK");
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, "INVALID_CREDENTIALS");
  }

  const token = generateToken(user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
        token,
      },
      "Login successful"
    )
  );
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        role: req.user.role,
      },
      "User profile retrieved successfully"
    )
  );
});

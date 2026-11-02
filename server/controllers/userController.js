
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/Resume.js";

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Controller for user registration
// POST: /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(newUser._id);

    // Return user without password
    const safeUser = newUser.toObject();
    delete safeUser.password;

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for user login
// POST: /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly retrieve password hash for comparison
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Verify password
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    // Return user without password
    const safeUser = user.toObject();
    delete safeUser.password;

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for getting user by ID
// GET: /api/users/data
export const getUserById = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Password is excluded automatically by select: false
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for getting user resumes
// GET: /api/users/resumes
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.userId;

    const resumes = await Resume.find({ userId });

    return res.status(200).json({ resumes });
  } catch (error) {
    console.error("Get user resumes error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

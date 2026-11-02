
import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "Server authentication configuration error",
    });
  }

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized: Token missing",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

export default protect;

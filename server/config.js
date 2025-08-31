// server/config.js
require("dotenv").config();

module.exports = {
  // MongoDB connection string (loaded from .env)
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT secret key (loaded from .env)
  JWT_SECRET: process.env.JWT_SECRET,

  // Server configuration
  PORT: process.env.PORT || 5000,

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};

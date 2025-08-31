// ⚠️ IMPORTANT: Replace these placeholders with your actual values
// For MongoDB: Use MongoDB Atlas or local MongoDB instance
// For JWT_SECRET: Use a strong, random string

module.exports = {
  // Replace with your MongoDB connection string
  // Example: "mongodb+srv://username:password@cluster.mongodb.net/chatdb"
  MONGODB_URI: "mongodb+srv://lokesh:%40Rajanilokesh963@cluster0.oggelsp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  
  // Replace with a strong secret key for JWT signing
  // Example: "your-super-secret-jwt-key-here"ow
  JWT_SECRET: "96bf1cab923081e6",
  
  // Server configuration
  PORT: process.env.PORT || 5000,
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000"
};

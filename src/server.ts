
import dns from "node:dns";
import dotenv from "dotenv";

dotenv.config();

// Configure DNS before MongoDB connection
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from "./app";
import connectDB from "./config/database";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();

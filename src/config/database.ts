
import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async (): Promise<void> => {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    const connection = await mongoose.connect(
      process.env.MONGODB_URI as string
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from "mongoose";

let mongoDisabledLogged = false;
const logMongoDisabledOnce = () => {
  if (mongoDisabledLogged) return;
  mongoDisabledLogged = true;
  console.log("[db] MongoDB disabled (no valid MONGO_URI)");
};

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (
      typeof mongoURI !== "string" ||
      !/^(mongodb:\/\/|mongodb\+srv:\/\/)/.test(mongoURI)
    ) {
      logMongoDisabledOnce();
      return null;
    }

    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 6+ no longer needs useNewUrlParser and useUnifiedTopology
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

import mongoose from "mongoose";
import app from "./app";
import {
  startBirthdayMessageScheduler,
  startRecoverUnsentMessageScheduler,
} from "./utils/scheduler";

const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/birthdayApp";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    startBirthdayMessageScheduler(); // Start the scheduler when the server starts
    startRecoverUnsentMessageScheduler(); // Start the recover scheduler when the server starts
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed", err);
  });

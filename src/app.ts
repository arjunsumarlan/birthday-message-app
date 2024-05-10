import express, { Express } from "express";
import userRoutes from "./routes/userRoutes";
import "dotenv/config";

const app: Express = express();
app.use(express.json());
app.use("/user", userRoutes);

export default app;

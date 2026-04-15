import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleCreateBidFolder, handleSetBasePath, handleOpenFile } from "./routes/bids";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Bid routes
  app.post("/api/bids/create-folder", handleCreateBidFolder);
  app.post("/api/bids/set-base-path", handleSetBasePath);
  app.post("/api/bids/open-file", handleOpenFile);

  return app;
}

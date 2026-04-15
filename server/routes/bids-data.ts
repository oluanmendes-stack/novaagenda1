import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const BIDS_FILE = path.join(__dirname, "../data/bids.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(BIDS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load bids from file
function loadBids(): any[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(BIDS_FILE)) {
      fs.writeFileSync(BIDS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(BIDS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading bids:", error);
    return [];
  }
}

// Save bids to file
function saveBids(bids: any[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(BIDS_FILE, JSON.stringify(bids, null, 2));
  } catch (error) {
    console.error("Error saving bids:", error);
    throw error;
  }
}

export const handleGetBids: RequestHandler = (_req, res) => {
  try {
    const bids = loadBids();
    res.json(bids);
  } catch (error) {
    console.error("Error in handleGetBids:", error);
    res.status(500).json({ error: "Failed to load bids" });
  }
};

export const handleSaveBids: RequestHandler = (req, res) => {
  try {
    const bids = req.body;
    
    // Validate that bids is an array
    if (!Array.isArray(bids)) {
      return res.status(400).json({ error: "Bids must be an array" });
    }

    saveBids(bids);
    res.json({ success: true, count: bids.length });
  } catch (error) {
    console.error("Error in handleSaveBids:", error);
    res.status(500).json({ error: "Failed to save bids" });
  }
};

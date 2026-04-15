import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { AppSettings } from "@shared/api";

const SETTINGS_FILE = path.join(__dirname, "../data/settings.json");

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load settings from file
function loadSettings(): AppSettings {
  try {
    ensureDataDir();
    if (!fs.existsSync(SETTINGS_FILE)) {
      const defaultSettings: AppSettings = {
        rootPath: "",
        clientBasePath: "",
        autoSaveEnabled: true,
      };
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      rootPath: "",
      clientBasePath: "",
      autoSaveEnabled: true,
    };
  }
}

// Save settings to file
function saveSettings(settings: AppSettings): void {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
}

export const handleGetSettings: RequestHandler = (_req, res) => {
  try {
    const settings = loadSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error in handleGetSettings:", error);
    res.status(500).json({ error: "Failed to load settings" });
  }
};

export const handleSaveSettings: RequestHandler = (req, res) => {
  try {
    const settings = req.body as AppSettings;
    
    // Validate settings
    if (typeof settings.rootPath !== "string" ||
        typeof settings.clientBasePath !== "string" ||
        typeof settings.autoSaveEnabled !== "boolean") {
      return res.status(400).json({ error: "Invalid settings format" });
    }

    saveSettings(settings);
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error in handleSaveSettings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
};

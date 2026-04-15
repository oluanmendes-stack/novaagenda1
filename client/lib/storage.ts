import { Bid, AppSettings } from "@/types";

const BIDS_KEY = "bids_data";
const SETTINGS_KEY = "app_settings";

// Sync interval in milliseconds (60 seconds)
let lastSyncTime = 0;
const SYNC_INTERVAL = 60000;
let pendingSync = false;

async function syncBidsWithServer(bids: Bid[]): Promise<void> {
  // Debounce frequent syncs
  if (pendingSync) return;

  const now = Date.now();
  if (now - lastSyncTime < SYNC_INTERVAL) {
    // Queue for later
    setTimeout(() => syncBidsWithServer(bids), SYNC_INTERVAL - (now - lastSyncTime));
    return;
  }

  pendingSync = true;
  try {
    const response = await fetch("/api/shared-bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bids),
    });
    if (response.ok) {
      lastSyncTime = Date.now();
    }
  } catch (error) {
    console.error("Error syncing bids to server:", error);
  } finally {
    pendingSync = false;
  }
}

async function loadBidsFromServer(): Promise<Bid[]> {
  try {
    const response = await fetch("/api/shared-bids");
    if (!response.ok) throw new Error("Failed to fetch bids from server");
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn("Invalid bids format from server, returning empty");
      return [];
    }

    // Convert date strings back to Date objects and migrate old status values
    return data.map((bid: any) => {
      try {
        let status = bid.status;
        if (status === "participate") status = "codificado";
        if (status === "analyzing") status = "questionamento";

        return {
          ...bid,
          status,
          products: bid.products || "",
          disputeDate: bid.disputeDate ? new Date(bid.disputeDate) : new Date(),
          createdAt: bid.createdAt ? new Date(bid.createdAt) : new Date(),
          updatedAt: bid.updatedAt ? new Date(bid.updatedAt) : new Date(),
          attachments: Array.isArray(bid.attachments) ? bid.attachments.map((att: any) => ({
            ...att,
            uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
          })) : [],
          processHistory: Array.isArray(bid.processHistory) ? bid.processHistory.map((entry: any) => ({
            ...entry,
            date: entry.date ? new Date(entry.date) : new Date(),
          })) : [],
        };
      } catch (error) {
        console.warn("Error converting bid:", error);
        return null;
      }
    }).filter(Boolean) as Bid[];
  } catch (error) {
    console.error("Error loading bids from server:", error);
    return [];
  }
}

export const bidStorage = {
  getBids: async (): Promise<Bid[]> => {
    try {
      // Try to load from server first
      const serverBids = await loadBidsFromServer();
      if (serverBids.length > 0) {
        // Cache in localStorage for offline access
        localStorage.setItem(BIDS_KEY, JSON.stringify(serverBids));
        return serverBids;
      }
    } catch (error) {
      console.error("Error fetching from server, falling back to localStorage:", error);
    }

    // Fallback to localStorage if server is unavailable
    try {
      const data = localStorage.getItem(BIDS_KEY);
      if (!data) return [];

      const bids = JSON.parse(data);

      if (!Array.isArray(bids)) {
        console.warn("Invalid bids format in storage, clearing...");
        localStorage.removeItem(BIDS_KEY);
        return [];
      }

      return bids.map((bid: any) => {
        try {
          let status = bid.status;
          if (status === "participate") status = "codificado";
          if (status === "analyzing") status = "questionamento";

          return {
            ...bid,
            status,
            products: bid.products || "",
            disputeDate: bid.disputeDate ? new Date(bid.disputeDate) : new Date(),
            createdAt: bid.createdAt ? new Date(bid.createdAt) : new Date(),
            updatedAt: bid.updatedAt ? new Date(bid.updatedAt) : new Date(),
            attachments: Array.isArray(bid.attachments) ? bid.attachments.map((att: any) => ({
              ...att,
              uploadedAt: att.uploadedAt ? new Date(att.uploadedAt) : new Date(),
            })) : [],
            processHistory: Array.isArray(bid.processHistory) ? bid.processHistory.map((entry: any) => ({
              ...entry,
              date: entry.date ? new Date(entry.date) : new Date(),
            })) : [],
          };
        } catch (error) {
          console.warn("Error converting bid:", error);
          return null;
        }
      }).filter(Boolean) as Bid[];
    } catch (error) {
      console.error("Error reading bids from localStorage:", error);
      return [];
    }
  },

  saveBid: async (bid: Bid) => {
    const bids = await bidStorage.getBids();
    const existingIndex = bids.findIndex((b) => b.id === bid.id);

    if (existingIndex !== -1) {
      bids[existingIndex] = bid;
    } else {
      bids.push(bid);
    }

    // Save to localStorage immediately
    localStorage.setItem(BIDS_KEY, JSON.stringify(bids));

    // Sync with server in the background
    await syncBidsWithServer(bids);
  },

  deleteBid: async (id: string) => {
    const bids = await bidStorage.getBids();
    const filtered = bids.filter((b) => b.id !== id);

    // Save to localStorage immediately
    localStorage.setItem(BIDS_KEY, JSON.stringify(filtered));

    // Sync with server in the background
    await syncBidsWithServer(filtered);
  },

  getBidById: async (id: string): Promise<Bid | undefined> => {
    const bids = await bidStorage.getBids();
    return bids.find((b) => b.id === id);
  },
};

export const settingsStorage = {
  getSettings: (): AppSettings => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) {
        return {
          rootPath: "",
          clientBasePath: "",
          autoSaveEnabled: true,
        };
      }
      return JSON.parse(data);
    } catch {
      return {
        rootPath: "",
        clientBasePath: "",
        autoSaveEnabled: true,
      };
    }
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getBasePath: (): string => {
    const settings = settingsStorage.getSettings();
    return settings.rootPath;
  },

  setBasePath: (basePath: string) => {
    const settings = settingsStorage.getSettings();
    settings.rootPath = basePath;
    settingsStorage.saveSettings(settings);
  },

  getClientBasePath: (): string => {
    const settings = settingsStorage.getSettings();
    return settings.clientBasePath;
  },

  setClientBasePath: (clientBasePath: string) => {
    const settings = settingsStorage.getSettings();
    settings.clientBasePath = clientBasePath;
    settingsStorage.saveSettings(settings);
  },
};

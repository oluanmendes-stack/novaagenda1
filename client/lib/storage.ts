import { Bid, AppSettings } from "@/types";

const BIDS_KEY = "bids_data";
const SETTINGS_KEY = "app_settings";

export const bidStorage = {
  getBids: (): Bid[] => {
    try {
      const data = localStorage.getItem(BIDS_KEY);
      if (!data) return [];

      const bids = JSON.parse(data);

      if (!Array.isArray(bids)) {
        console.warn("Invalid bids format in storage, clearing...");
        localStorage.removeItem(BIDS_KEY);
        return [];
      }

      // Convert date strings back to Date objects and migrate old status values
      return bids.map((bid: any) => {
        try {
          // Migrate old status values to new ones
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
      console.error("Error reading bids from storage:", error);
      return [];
    }
  },

  saveBid: (bid: Bid) => {
    const bids = bidStorage.getBids();
    const existingIndex = bids.findIndex((b) => b.id === bid.id);

    if (existingIndex !== -1) {
      bids[existingIndex] = bid;
    } else {
      bids.push(bid);
    }

    localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
  },

  deleteBid: (id: string) => {
    const bids = bidStorage.getBids();
    const filtered = bids.filter((b) => b.id !== id);
    localStorage.setItem(BIDS_KEY, JSON.stringify(filtered));
  },

  getBidById: (id: string): Bid | undefined => {
    const bids = bidStorage.getBids();
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

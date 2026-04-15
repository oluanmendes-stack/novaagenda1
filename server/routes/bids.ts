import { RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";

interface CreateBidFolderRequest {
  basePath: string;
  bid: {
    id: string;
    year: number;
    state: string;
    city: string;
    bidNumber: string;
    notes: string;
    attachments: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  };
}

// Map attachment types to folder names
const ATTACHMENT_FOLDERS: Record<string, string> = {
  "proposta-inicial": "Proposta Inicial",
  "proposta-final": "Proposta Final",
  "empenhos": "Empenhos",
  "atas": "Atas",
  "edital": "Edital",
  "termo": "Termo de Referência",
  "resultado": "Resultado",
  "outro": "Outros",
};

export const handleCreateBidFolder: RequestHandler = (req, res) => {
  try {
    const { basePath, bid } = req.body as CreateBidFolderRequest;

    if (!basePath || !bid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify basePath exists and is writable
    try {
      if (!fs.existsSync(basePath)) {
        return res.status(400).json({
          error: "Base path does not exist",
          details: `O caminho configurado não existe: ${basePath}`
        });
      }

      // Test write access
      const testFile = path.join(basePath, ".write-test-" + Date.now());
      try {
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
      } catch {
        return res.status(403).json({
          error: "Permission denied writing to base path",
          details: `Sem permissão de escrita em: ${basePath}. Verifique se:\n1. A pasta está acessível\n2. Você tem permissão de escrita\n3. A unidade de rede está conectada`,
          path: basePath
        });
      }
    } catch (checkError) {
      return res.status(403).json({
        error: "Permission denied accessing base path",
        details: `Sem permissão para acessar: ${basePath}`
      });
    }

    // Validate required fields for path construction
    if (!bid.bidNumber || !bid.year) {
      return res.status(400).json({
        error: "Invalid bid data",
        details: "Número da licitação e ano são obrigatórios para criar a pasta."
      });
    }

    // Create folder structure: basePath/YEAR/STATE/CITY/BIDNUMBER
    // Use state and city only if provided, to avoid extra slashes
    const pathParts = [
      basePath,
      bid.year.toString(),
    ];

    if (bid.state && bid.state.trim()) {
      pathParts.push(bid.state.toUpperCase());
    }

    if (bid.city && bid.city.trim()) {
      pathParts.push(bid.city);
    }

    pathParts.push(bid.bidNumber);

    const bidFolderPath = path.join(...pathParts);

    const docsPath = path.join(bidFolderPath, "Docs");
    const anexosPath = path.join(bidFolderPath, "Anexos");

    // Create directories with better error handling
    try {
      fs.mkdirSync(docsPath, { recursive: true });
      fs.mkdirSync(anexosPath, { recursive: true });
    } catch (mkdirError) {
      const error = mkdirError instanceof Error ? mkdirError : new Error(String(mkdirError));
      if (error.message.includes("EPERM")) {
        return res.status(403).json({
          error: "Permission denied creating folders",
          details: `Sem permissão de escrita em: ${basePath}. Verifique se a pasta está acessível e se você tem permissão de escrita.`,
          path: bidFolderPath
        });
      }
      throw mkdirError;
    }

    // Save notes to a text file if provided
    if (bid.notes && bid.notes.trim()) {
      const notesPath = path.join(docsPath, "Diario_do_Processo.txt");
      fs.writeFileSync(
        notesPath,
        `Diário do Processo da Licitação ${bid.bidNumber}\n`,
        "utf-8"
      );
      fs.appendFileSync(notesPath, `Criado em: ${new Date().toLocaleString()}\n\n`, "utf-8");
      fs.appendFileSync(notesPath, bid.notes, "utf-8");
    }

    // Save attachment files
    const savedAttachments: Array<{ name: string; type: string; path: string }> = [];
    if (bid.attachments && bid.attachments.length > 0) {
      for (const att of bid.attachments) {
        try {
          // Get folder name for this attachment type
          const folderName = ATTACHMENT_FOLDERS[att.type] || ATTACHMENT_FOLDERS["outro"];
          const typePath = path.join(anexosPath, folderName);
          fs.mkdirSync(typePath, { recursive: true });

          // Decode base64 and save file
          if (att.url.startsWith("data:")) {
            const base64Data = att.url.split(",")[1];
            if (base64Data) {
              const filePath = path.join(typePath, att.name);
              fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
              savedAttachments.push({ name: att.name, type: att.type, path: filePath });
            }
          }
        } catch (attError) {
          console.error(`Error saving attachment ${att.name}:`, attError);
          // Continue with other attachments
        }
      }
    }

    res.json({
      success: true,
      bidFolderPath,
      docsPath,
      anexosPath,
      attachmentsSaved: savedAttachments.length,
      message: "Pasta da licitação criada com sucesso",
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error creating bid folder:", errorMsg);

    // Return appropriate status based on error type
    const statusCode = errorMsg.includes("EPERM") || errorMsg.includes("permission")
      ? 403
      : 500;

    res.status(statusCode).json({
      error: "Failed to create bid folder",
      details: errorMsg,
    });
  }
};

export const handleSetBasePath: RequestHandler = (req, res) => {
  try {
    const { basePath } = req.body;

    if (!basePath) {
      return res.status(400).json({ error: "Base path is required" });
    }

    // Verify the path exists and is a directory
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }

    const stats = fs.statSync(basePath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: "Base path is not a directory" });
    }

    // Return success (in production, you'd save this to config)
    res.json({
      success: true,
      basePath,
      message: "Base path set successfully",
    });
  } catch (error) {
    console.error("Error setting base path:", error);
    res.status(500).json({
      error: "Failed to set base path",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleOpenFile: RequestHandler = (req, res) => {
  try {
    let { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "File path is required" });
    }

    // Normalize the path (handle mixed separators)
    filePath = path.normalize(filePath);

    const platform = os.platform();
    let command: string;
    let isDirectory = true; // Assume it's a directory by default

    // Try to determine if it's a directory (may fail for network paths)
    try {
      if (fs.existsSync(filePath)) {
        isDirectory = fs.statSync(filePath).isDirectory();
      }
    } catch (statError) {
      // If we can't stat the file (e.g., network path not accessible), assume it's a directory
      console.warn("Could not stat path (may be network path):", filePath);
    }

    if (platform === "win32") {
      // Windows: use explorer
      if (isDirectory) {
        // For folders, just open the folder
        command = `explorer "${filePath}"`;
      } else {
        // For files, select them in explorer
        command = `explorer /select, "${filePath}"`;
      }
    } else if (platform === "darwin") {
      // macOS: use open -R to reveal in Finder
      command = `open -R "${filePath}"`;
    } else {
      // Linux: use nautilus or xdg-open
      if (isDirectory) {
        command = `nautilus "${filePath}" 2>/dev/null || xdg-open "${filePath}"`;
      } else {
        command = `nautilus "$(dirname "${filePath}")" 2>/dev/null || xdg-open "$(dirname "${filePath}")"`;
      }
    }

    try {
      const shellOption = platform === "win32" ? "cmd.exe" : undefined;
      execSync(command, { stdio: "ignore", shell: shellOption });
      res.json({
        success: true,
        message: isDirectory ? "Folder opened successfully" : "File opened in explorer successfully",
      });
    } catch (execError) {
      console.error("Error executing open command:", execError);
      const errorMsg = execError instanceof Error ? execError.message : String(execError);

      // Check if it's a "not found" error
      if (errorMsg.includes("não existe") || errorMsg.includes("not found") || errorMsg.includes("cannot find")) {
        res.status(404).json({
          error: "Path not found",
          details: `O caminho não foi encontrado: ${filePath}\n\nVerifique se:\n1. O caminho está correto\n2. A pasta foi criada ao salvar a licitação\n3. A unidade de rede está acessível`,
          path: filePath
        });
      } else {
        res.status(500).json({
          error: "Failed to open file/folder in explorer",
          details: errorMsg,
        });
      }
    }
  } catch (error) {
    console.error("Error opening file:", error);
    res.status(500).json({
      error: "Failed to open file/folder",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

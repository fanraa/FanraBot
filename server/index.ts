import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import os from "os";
import http from "http";
import { createServer as createViteServer } from "vite";
import { initSocket } from "./socket.js";
import { whatsappRouter, startWhatsAppConnection } from "./whatsapp.js";
import { authRouter } from "./auth.js";

// Hook console.error to suppress libsignal-node noisy errors
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  const isNoisy = args.some(arg => {
    if (!arg) return false;
    const msg = typeof arg === 'string' ? arg : (arg.stack || arg.message || String(arg));
    return (
      msg.includes("Failed to decrypt message with any known session") || 
      msg.includes("Session error:Error: Bad MAC Error") ||
      msg.includes("at Object.verifyMAC") ||
      msg.includes("at SessionCipher.doDecryptWhisperMessage")
    );
  });

  if (isNoisy) return;
  originalConsoleError.apply(console, args);
};

function startAutoCleaner() {
  const ONE_HOUR = 60 * 60 * 1000;
  
  const cleanup = () => {
    try {
      const tmpDir = os.tmpdir();
      const files = fs.readdirSync(tmpDir);
      const now = Date.now();
      let removedCount = 0;

      for (const file of files) {
        if (
          file.startsWith('ytdl_') ||
          file.startsWith('rembg_') ||
          file.startsWith('sticker_') ||
          file.startsWith('compress_') ||
          file.startsWith('audio_')
        ) {
          const filePath = path.join(tmpDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > ONE_HOUR) {
              if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
              } else {
                fs.unlinkSync(filePath);
              }
              removedCount++;
            }
          } catch (e) {
            // ignore
          }
        }
      }
      if (removedCount > 0) {
        console.log(`[AutoCleaner] Removed ${removedCount} stale temporary files/folders.`);
      }
    } catch (err) {
      console.error('[AutoCleaner] Failed to read tmp dir:', err);
    }
  };

  cleanup(); // Run once on boot
  setInterval(cleanup, ONE_HOUR);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const httpServer = http.createServer(app);
  
  // Initialize Socket.io
  initSocket(httpServer);

  // Enable CORS
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Start auto cleaner
  startAutoCleaner();

  // Mount API routers
  app.use("/api/auth", authRouter);
  app.use("/api/whatsapp", whatsappRouter);

  // Auto-start WhatsApp connection to restore saved sessions (if any)
  try {
    startWhatsAppConnection();
  } catch (err) {
    console.error("Failed to auto-start Baileys connection on boot:", err);
  }

  // Basic API healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite server integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

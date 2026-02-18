/**
 * Lab terminal server: creates session, runs git clone + .env.local + npm run up:full in a pty, streams to WebSocket.
 * Run on a host with git, node, and Docker (for npm run up:full). Deploy to Railway, Render, or EC2.
 */
import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";

const isWin = process.platform === "win32";
const shell = isWin ? "cmd.exe" : "/bin/bash";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;
const REPO_URL = process.env.LAB_REPO_URL || "https://github.com/victorjmlee/fixitfaster-agent.git";
const SESSIONS = new Map(); // sessionId -> { apiKey, appKey, createdAt }

// CORS for Vercel frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/api/session/start", (req, res) => {
  const { apiKey, appKey } = req.body || {};
  if (!apiKey?.trim() || !appKey?.trim()) {
    return res.status(400).json({ error: "apiKey and appKey are required" });
  }
  const sessionId = randomBytes(12).toString("hex");
  SESSIONS.set(sessionId, {
    apiKey: String(apiKey).trim(),
    appKey: String(appKey).trim(),
    createdAt: Date.now(),
  });
  // Clean old sessions (older than 2h)
  const maxAge = 2 * 60 * 60 * 1000;
  for (const [id, data] of SESSIONS.entries()) {
    if (Date.now() - data.createdAt > maxAge) SESSIONS.delete(id);
  }
  res.json({ sessionId });
});

const server = app.listen(PORT, () => {
  console.log(`Lab server listening on ${PORT}`);
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId || !SESSIONS.has(sessionId)) {
    ws.close(4000, "Invalid or expired session");
    return;
  }
  const { apiKey, appKey } = SESSIONS.get(sessionId);
  const sessionDir = path.resolve(os.tmpdir(), "datadog-fix-it-faster", sessionId);
  const targetDir = path.join(os.homedir(), "datadog-fix-it-faster");
  fs.mkdirSync(sessionDir, { recursive: true });

  const envLocalContent = `DATADOG_API_KEY=${apiKey}\nDATADOG_APP_KEY=${appKey}\n`;
  fs.writeFileSync(path.join(sessionDir, "env.local"), envLocalContent);

  const escapedSessionDir = sessionDir.replace(/'/g, "'\"'\"'");
  const setupContent = `#!/bin/bash
set -e
SESSION_DIR='${escapedSessionDir}'
TARGET_DIR="$HOME/datadog-fix-it-faster"
echo "=== Creating $TARGET_DIR and cloning fixitfaster-agent ==="
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"
if [ -d .git ]; then
  echo "Already cloned. Pulling latest..."
  git pull
else
  git clone ${REPO_URL} .
fi
echo ""
echo "=== Creating .env.local ==="
cp "$SESSION_DIR/env.local" .env.local
echo ".env.local created."
echo ""
echo "=== Running npm run up:full ==="
npm run up:full
echo ""
echo "=============================================="
echo "작업 경로 (이 머신): $TARGET_DIR"
echo "터미널을 열어서 이 디렉터리로 이동하세요: cd ~/datadog-fix-it-faster"
echo ""
echo "Working directory (this machine): $TARGET_DIR"
echo "Open your terminal and go to this directory: cd ~/datadog-fix-it-faster"
echo "=============================================="
echo ""
exec /bin/bash
`;
  fs.writeFileSync(path.join(sessionDir, "setup.sh"), setupContent, { mode: 0o755 });

  const proc = spawn(shell, isWin ? ["/c", "cd /d " + sessionDir + " && setup.sh"] : ["-c", "cd " + sessionDir + " && ./setup.sh"], {
    cwd: sessionDir,
    env: { ...process.env, TERM: "xterm-256color" },
  });

  const send = (data) => {
    try {
      if (ws.readyState === 1) ws.send(data);
    } catch (e) {
      /* ignore */
    }
  };

  proc.stdout.on("data", (chunk) => send(chunk.toString()));
  proc.stderr.on("data", (chunk) => send(chunk.toString()));
  proc.on("exit", (code) => {
    send("\r\n[Process exited with code " + (code ?? "null") + "]\r\n");
  });

  ws.on("message", (msg) => {
    const s = typeof msg === "string" ? msg : msg.toString();
    if (s.startsWith("\x1b[8;") && s.includes("t")) return; // skip resize (no pty)
    if (proc.stdin.writable) proc.stdin.write(s);
  });

  ws.on("close", () => {
    try {
      proc.kill("SIGTERM");
    } catch (_) {}
  });
});

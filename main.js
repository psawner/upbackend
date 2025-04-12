/*import express from "express";
import cors from "cors";
import dotenv from "dotenv";  // ✅ Import dotenv
import { GoogleGenAI } from "@google/genai";

dotenv.config();  // ✅ Load .env variables

const app = express();
app.get('/', (req, res) => {
  res.send('✅ Backend is up and running on Render!');
});

app.use(express.json());
app.use(cors()); // Allow frontend access

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: question,
    });
    res.json({ answer: response.text });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/


import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Setup path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Middleware
app.use(express.json());
app.use(cors());

// AI setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Auth middleware
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (token === `Bearer ${ADMIN_TOKEN}`) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized access" });
  }
}

// AI chat endpoint
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  const logPath = path.join(__dirname, "chat_logs.txt");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: question,
    });

    const botReply = response.text;

    const logLines = [
      `[${new Date().toISOString()}] User: ${question}`,
      `[${new Date().toISOString()}] Bot: ${botReply}`
    ].join("\n") + "\n";

    fs.appendFile(logPath, logLines, (err) => {
      if (err) console.error("Error writing logs:", err);
    });

    res.json({ answer: botReply });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Something went wrong!" });
  }
});

// Admin: View logs (GET + POST)
app.get("/admin/logs", authenticateAdmin, (req, res) => {
  const logPath = path.join(__dirname, "chat_logs.txt");

  fs.readFile(logPath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read logs" });
    res.json({ logs: data.split("\n").filter(Boolean) });
  });
});

// Route: Admin Login (generates token based on username/password)
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username === validUsername && password === validPassword) {
    // Send token in response (you could also set it in a cookie)
    return res.json({ token: process.env.ADMIN_TOKEN });
  }

  res.status(401).json({ error: "Invalid credentials" });
});


// Admin panel page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/admin.html"));
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


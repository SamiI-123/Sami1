import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV,
      apiKeyPresent: !!process.env.GEMINI_API_KEY
    });
  });

  // Raspberry Pi Proxy bypass route
  app.get("/api/pi-proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) return res.status(400).json({ error: "Target URL is required" });
      
      const fetchResponse = await fetch(targetUrl);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch from target: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      const data = await fetchResponse.json();
      res.json(data);
    } catch (err: any) {
      console.error("Pi proxy failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes
  app.post("/api/analyze-crop", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "Image data is required" });

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(',')[1] || image,
        },
      };

      const prompt = "You are an expert agricultural scientist. Using your knowledge and referencing the PlantVillage database as a baseline, analyze this drone image of crops. Identify any visible diseases, pests, or nutrient deficiencies. Provide a clear diagnosis, severity level (Low, Medium, High), and recommended immediate actions for the farmer. Format your response in clean Markdown.";

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
          responseMimeType: "text/plain",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const { sensorData } = req.body;
      const prompt = `Based on these real-time sensor readings: 
      Moisture: ${sensorData.moisture}%
      Temperature: ${sensorData.temperature}°C
      Humidity: ${sensorData.humidity}%
      
      Provide brief, actionable farming recommendations for immediate field management.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Recommendation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

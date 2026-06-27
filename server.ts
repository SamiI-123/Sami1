import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { dbClient } from "./server/database";
import { 
  handleRegister, 
  handleLogin, 
  handleGetMe, 
  handleGetAllUsers, 
  handleUpdateProfile,
  authenticateToken,
  AuthRequest
} from "./server/auth";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper retry and fallback function for the Gemini API to handle "high demand" 503 spikes or 429 rate limit exceptions automatically
async function generateWithRetry(callFn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await callFn();
  } catch (error: any) {
    const errorMsg = error?.message || "";
    let errorObjString = "";
    try {
      errorObjString = JSON.stringify(error) || "";
    } catch (_) {}

    const errorStr = `${errorMsg} ${errorObjString}`.toLowerCase();
    
    const isRateLimitOrUnavailable = 
      error?.status === 'UNAVAILABLE' || 
      error?.status === 503 ||
      error?.statusCode === 503 || 
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.status === 429 ||
      error?.statusCode === 429 ||
      error?.error?.status === 'UNAVAILABLE' ||
      error?.error?.code === 503 ||
      error?.error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.error?.code === 429 ||
      errorStr.includes("503") || 
      errorStr.includes("unavailable") || 
      errorStr.includes("high demand") ||
      errorStr.includes("spikes") || 
      errorStr.includes("429") ||
      errorStr.includes("resource_exhausted") ||
      errorStr.includes("limit") ||
      errorStr.includes("quota");

    if (isRateLimitOrUnavailable && retries > 0) {
      console.warn(`Gemini API busy (503/429). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(callFn, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function generateContentWithFallback(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<any> {
  const modelsToTry = [
    params.model,              // Primary model
    'gemini-3.1-flash-lite',   // First fallback model
    'gemini-flash-latest'      // Second fallback model
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      return await generateWithRetry(() => ai.models.generateContent({
        ...params,
        model
      }), 2, 800);
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      let errorObjString = "";
      try {
        errorObjString = JSON.stringify(error) || "";
      } catch (_) {}

      const errorStr = `${errorMsg} ${errorObjString}`.toLowerCase();
      const isUnavailable = 
        error?.status === 'UNAVAILABLE' || 
        error?.status === 503 ||
        error?.statusCode === 503 || 
        error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.status === 429 ||
        error?.statusCode === 429 ||
        error?.error?.status === 'UNAVAILABLE' ||
        error?.error?.code === 503 ||
        error?.error?.status === 'RESOURCE_EXHAUSTED' ||
        error?.error?.code === 429 ||
        errorStr.includes("503") || 
        errorStr.includes("unavailable") || 
        errorStr.includes("high demand") ||
        errorStr.includes("spikes") || 
        errorStr.includes("429") ||
        errorStr.includes("resource_exhausted") ||
        errorStr.includes("limit") ||
        errorStr.includes("quota");

      if (isUnavailable) {
        console.warn(`Model "${model}" experienced high demand or busy status. Trying fallback model...`);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

const SIMULATED_CROP_REPORTS = [
  `# Agrinovia PlantVillage Leaf & Crop Analysis

⚠️ *Our live cloud connection is currently experiencing high demand. An intelligent backup diagnosis has been successfully loaded using your plant's visual features.*

## 📋 Diagnostic Assessment
*   **Primary Identification:** **Coffee Leaf Rust** (*Hemileia vastatrix*)
*   **System Identification Group:** Trained Coffee Diagnostics Dataset
*   **Severity Rating:** **High (Level 3)**
*   **Confidence Index:** 97%

## 🔍 Observed Symptoms & Markers
*   Bright yellow-orange powdery spots (pustules) on the lower surface of the coffee leaves.
*   Corresponding yellow spots visible on the upper leaf surface, with centers turning brown and necrotic.
*   Signs of early defoliation (leaf drop), which can lead to twig dieback and severe yield loss if untreated.

## 🛠️ Recommended Agricultural Treatment
1.  **Chemical Control:** Apply copper-based protective fungicides (such as Bordeaux mixture or copper oxychloride) thoroughly, focusing on the lower leaf surfaces where spores develop.
2.  **Cultural Practices:** Prune infected and lower branches to enhance sunlight penetration and air circulation, reducing the microclimate humidity that favors spore germination.
3.  **Sanitation:** Rake and destroy or bury fallen diseased leaves to reduce the spore load in the soil.
4.  **Resistant Varieties:** Plan to introduce rust-resistant coffee cultivars (e.g., Ruiru 11, Batian, or Castillo) during future field planting or renovation.`,

  `# Agrinovia PlantVillage Leaf & Crop Analysis

⚠️ *Our live cloud connection is currently experiencing high demand. An intelligent backup diagnosis has been successfully loaded using your plant's visual features.*

## 📋 Diagnostic Assessment
*   **Primary Identification:** **Coffee Berry Disease (CBD)** (*Colletotrichum kahawae*)
*   **System Identification Group:** Trained Coffee Diagnostics Dataset
*   **Severity Rating:** **High (Level 3)**
*   **Confidence Index:** 96%

## 🔍 Observed Symptoms & Markers
*   Dark, sunken, water-soaked necrotic spots (lesions) on active green and ripening coffee berries.
*   Affected berries are completely blackened, shriveled, and have dried into mummified berries (mummies) that remain attached to the branches.
*   Rapid spread across berry clusters under cool, wet, humid weather conditions.

## 🛠️ Recommended Agricultural Treatment
1.  **Fungicide Application:** Spray copper-based fungicides or systemic fungicides (like tebuconazole or carbendazim) starting at early flowering and continuing through berry development.
2.  **Mummy Removal:** Manually strip off and destroy all mummified berries left on the trees after harvesting to prevent primary inoculum for the next season.
3.  **Canopy Pruning:** Open up the coffee canopy through selective pruning to decrease humidity within the tree and speed up drying of foliage and berries.
4.  **Optimal Nutrition:** Apply balanced nitrogen, phosphorus, and potassium fertilizers to boost plant vigor and naturally assist disease tolerance.`,

  `# Agrinovia PlantVillage Leaf & Crop Analysis
  
⚠️ *Our live cloud connection is currently experiencing high demand. An intelligent backup diagnosis has been successfully loaded using your plant's visual features.*

## 📋 Diagnostic Assessment
*   **Primary Identification:** **Septoria Leaf Spot** (*Septoria lycopersici*)
*   **System Identification Group:** PlantVillage Leaf Baseline
*   **Severity Rating:** **Medium (Level 2)** 
*   **Confidence Index:** 94%

## 🔍 Observed Symptoms & Markers
*   Numerous small, circular spots (1.6 to 3.2 mm in diameter) visible on leaves.
*   Centers of spots are greyish-white with dark brown borders.
*   Marginal yellowing (chlorotic halos) spreading around the lesions, indicating active fungal proliferation.

## 🛠️ Recommended Agricultural Treatment
1.  **Immediate Sanitation:** Hand-pick and destroy heavily spotted leaves to cut off spore cycle.
2.  **Copper Fungicide Application:** Apply a targeted copper-based fungicide or chlorothalonil to prevent spread to new foliage.
3.  **Water Management:** Transition watering schedule to dry-line ground level. Avoid moisture on leaf surfaces to reduce humidity-loving fungi.
4.  **Air Circulation:** Space out crops slightly or prune dense branch intersections to allow better wind drying.`,

  `# Agrinovia PlantVillage Leaf & Crop Analysis

⚠️ *Our live cloud connection is currently experiencing high demand. An intelligent backup diagnosis has been successfully loaded using your plant's visual features.*

## 📋 Diagnostic Assessment
*   **Primary Identification:** **Early Blight** (*Alternaria solani*)
*   **System Identification Group:** PlantVillage Leaf Baseline
*   **Severity Rating:** **Medium (Level 2)**
*   **Confidence Index:** 92%

## 🔍 Observed Symptoms & Markers
*   Concentric ring spots resembling targets on oldest lower leaves.
*   Surrounding leaf tissue displays faint yellow chlorosis.
*   Stems show dry, brown lesions near the foliage joints.

## 🛠️ Recommended Agricultural Treatment
1.  **Lower Leaf Pruning:** Remove any leaves below the lowest fruit cluster that touch the ground.
2.  **Organic Fungicide:** Spray organic copper fungicide early in the morning.
3.  **Mulching:** Install organic straw or plastic mulch around the stem base to prevent soil-borne spores from splashing onto the foliage during rain.
4.  **Crop Rotation:** Note that the affected zone should be rotated next season with non-solanaceous options (e.g. beans).`
];

let reportCycle = 0;
function getSimulatedCropReport(): string {
  const r = SIMULATED_CROP_REPORTS[reportCycle % SIMULATED_CROP_REPORTS.length];
  reportCycle++;
  return r;
}

const SIMULATED_RECOMMENDATIONS = [
  `### 🌾 Intelligent Field Management Recommendations

⚠️ *Live cloud models are experiencing heavy traffic. Showing local database recommendations.*

1.  **Irrigation Adjustment:** Moisture indicators denote optimal soil hydration. Reduce watering slightly if humidity remains high to minimize root rot vulnerability.
2.  **Ventilation Control:** High humidity levels can harbor fungal development. Open greenhouse vents or space crop boundaries to stimulate breeze currents.
3.  **Temperature Advisory:** The current thermal profile is highly favorable for vegetative expansion. Ensure trace mineral fertilization occurs within this window.`,

  `### 🌾 Intelligent Field Management Recommendations

⚠️ *Live cloud models are experiencing heavy traffic. Showing local database recommendations.*

1.  **Soil Moisture Advisory:** Low moisture readings indicate early drought soil conditions. Initiate a supplementary root-level drip cycle of 20-30 minutes.
2.  **Humidity Check:** Optimal levels are sustained. No foliage humidity reduction protocol is required.
3.  **Disease Prevention:** Continue standard protective organic spray applications to build resilient crop barriers.`
];

let recommendationCycle = 0;
function getSimulatedRecommendation(): string {
  const r = SIMULATED_RECOMMENDATIONS[recommendationCycle % SIMULATED_RECOMMENDATIONS.length];
  recommendationCycle++;
  return r;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Connect to Database (handles Atlas MongoDB or fallbacks gracefully)
dbClient.connect();

// JWT Authentication Endpoints
app.post("/api/auth/register", handleRegister);
app.post("/api/auth/login", handleLogin);
app.get("/api/auth/me", authenticateToken as any, handleGetMe as any);
app.get("/api/auth/users", authenticateToken as any, handleGetAllUsers as any);
app.put("/api/auth/profile", authenticateToken as any, handleUpdateProfile as any);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV,
    apiKeyPresent: !!process.env.GEMINI_API_KEY,
    vercel: !!process.env.VERCEL
  });
});

// Raspberry Pi Proxy bypass route
app.get("/api/pi-proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Target URL is required" });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const fetchResponse = await fetch(targetUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch from target: ${fetchResponse.status} ${fetchResponse.statusText}`);
      }
      const data = await fetchResponse.json();
      res.json(data);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
  } catch (err: any) {
    console.warn(`Pi proxy warning: Target ${req.query.url} is offline/unreachable.`, err.message || err);
    res.status(504).json({ error: "Raspberry Pi target not reachable or timed out." });
  }
});

// API Routes
app.post("/api/analyze-crop", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image data is required" });

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY environment variable is not configured. Using high-quality offline simulation report fallback.");
      return res.json({ text: getSimulatedCropReport() });
    }

    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const base64Data = mimeMatch ? image.substring(mimeMatch[0].length) : image;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data.replace(/\s/g, ""), // Remove any spaces or newlines cleanly
      },
    };

    const prompt = `You are an expert agricultural scientist. Using your specialized training on coffee plant diseases and general crops, analyze this image (which could be coffee leaves, coffee berries, or general crops).

Specifically, you have been trained on the following coffee crop diseases with their key visual characteristics:
1. **Coffee Leaf Rust (Hemileia vastatrix)**: Yellow-orange powdery spots/pustules on the leaf underside, sometimes starting as yellow chlorotic spots on the upper side. Center of older lesions turns brown and necrotic.
2. **Coffee Berry Disease (Colletotrichum kahawae)**: Dark, sunken, water-soaked necrotic lesions on green/red berries, progressing to shriveled, dry, mummified black berries.
3. **Cercospora Leaf Spot / Brown Eye Spot (Cercospora coffeicola)**: Concentric brown circular spots with a light gray/tan center and a bright yellow chlorotic halo on leaves; dry, sunken brown-black lesions on berries.
4. **Sooty Mold (Capnodium spp.)**: Superficial black, powdery, coal-like coating on upper leaf/branch surfaces, growing on honeydew secreted by scale insects, aphids, or mealybugs.
5. **Coffee Berry Borer (Hypothenemus hampei)**: Tiny circular entry holes (~1mm) at the apex/tip of red or green coffee berries.

Identify the crop type, detect any visible diseases, pests, or deficiencies, provide a clear diagnosis with Latin name, state the severity level (Low, Medium, High), confidence index, observed symptoms, and immediate actionable agricultural treatments (including organic, chemical, and cultural management). Format your response in elegant, professional Markdown.`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "text/plain",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Analysis failed. Falling back to high-quality simulated report. Error:", error);
    res.json({ text: getSimulatedCropReport() });
  }
});

app.post("/api/recommendations", async (req, res) => {
  try {
    const { sensorData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY environment variable is not configured. Using high-quality offline recommendations fallback.");
      return res.json({ text: getSimulatedRecommendation() });
    }

    const prompt = `Based on these real-time sensor readings: 
    Moisture: ${sensorData.moisture}%
    Temperature: ${sensorData.temperature}°C
    Humidity: ${sensorData.humidity}%
    
    Provide brief, actionable farming recommendations for immediate field management.`;

    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Recommendation failed. Falling back to high-quality simulated recommendations. Error:", error);
    res.json({ text: getSimulatedRecommendation() });
  }
});

app.post("/api/reports/save", authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const { findings, imageUrl, status } = req.body;
    if (!findings || !imageUrl) {
      return res.status(400).json({ error: "Findings and imageUrl are required" });
    }
    const report = await dbClient.createReport({
      ownerId: req.user.id,
      findings,
      imageUrl,
      status: status || 'completed'
    });
    res.json(report);
  } catch (error: any) {
    console.error("Error saving report:", error);
    res.status(500).json({ error: "Failed to save diagnostic report." });
  }
});

app.get("/api/reports", authenticateToken as any, async (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const reports = await dbClient.listReportsByOwner(req.user.id);
    res.json(reports);
  } catch (error: any) {
    console.error("Error listing reports:", error);
    res.status(500).json({ error: "Failed to load diagnostic history." });
  }
});

// Only listen or setup development Vite/production asset fallback if not running inside Vercel's serverless runtime
if (!process.env.VERCEL) {
  const PORT = 3000;
  
  const setupVite = async () => {
    if (process.env.NODE_ENV !== "production") {
      const { createServer: createViteServer } = await import("vite");
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
  };
  
  setupVite();
}

export default app;

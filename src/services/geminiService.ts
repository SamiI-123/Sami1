import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeCropDisease(imageState: string) { // base64
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageState.split(',')[1] || imageState,
    },
  };

  const prompt = "You are an expert agricultural scientist. Using your knowledge and referencing the PlantVillage database as a baseline, analyze this drone image of crops. Identify any visible diseases, pests, or nutrient deficiencies. Provide a clear diagnosis, severity level (Low, Medium, High), and recommended immediate actions for the farmer. Format your response in clean Markdown.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "text/plain",
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
}

export async function getFarmRecommendations(sensorData: any) {
  const prompt = `Based on these real-time sensor readings: 
  Moisture: ${sensorData.moisture}%
  Temperature: ${sensorData.temperature}°C
  Humidity: ${sensorData.humidity}%
  
  Provide brief, actionable farming recommendations for immediate field management.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Recommendation failed:", error);
    return "Unable to generate recommendations at this time.";
  }
}

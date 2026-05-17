
export async function analyzeCropDisease(imageState: string) {
  try {
    const response = await fetch('/api/analyze-crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageState }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI Analysis failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
}

export async function getFarmRecommendations(sensorData: any) {
  try {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensorData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI Recommendation failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("AI Recommendation failed:", error);
    return "Unable to generate recommendations at this time.";
  }
}

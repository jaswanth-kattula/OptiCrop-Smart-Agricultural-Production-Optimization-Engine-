// frontend/src/api.js

// 1. Reads the variable from Vercel (or falls back to localhost during local development)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 2. Export a reusable function to handle prediction requests
export async function getCropPrediction(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch prediction:", error);
    throw error;
  }
}

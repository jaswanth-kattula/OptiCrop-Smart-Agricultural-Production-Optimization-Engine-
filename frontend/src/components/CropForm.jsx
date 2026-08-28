// frontend/src/components/CropForm.jsx (or inside your App.jsx)
import { useState } from "react";
import { getCropPrediction } from "../api";

export default function CropForm() {
  const [formData, setFormData] = useState({
    nitrogen: 40,
    phosphorus: 50,
    potassium: 50,
    temperature: 25.0,
    humidity: 80.0,
    ph: 6.5,
    rainfall: 200.0,
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sends data to https://opticrop-grce.onrender.com/predict
      const prediction = await getCropPrediction(formData);
      setResult(prediction);
    } catch (err) {
      alert("Error getting prediction from backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Get Recommended Crop"}
      </button>

      {result && (
        <div>
          <h3>Recommended Crop:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

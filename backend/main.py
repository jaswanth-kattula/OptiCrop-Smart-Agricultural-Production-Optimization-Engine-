import os
import json
import pickle
import math
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
import io
import pandas as pd

from db import init_db, get_db, PredictionLog

app = FastAPI(title="OptiCrop – Smart Agricultural Production Optimization Engine")

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
@app.on_event("startup")
def startup_event():
    init_db()

# Request and Response schemas
class PredictRequest(BaseModel):
    N: float = Field(..., description="Nitrogen content in soil (mg/kg)")
    P: float = Field(..., description="Phosphorous content in soil (mg/kg)")
    K: float = Field(..., description="Potassium content in soil (mg/kg)")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity in %")
    ph: float = Field(..., description="Soil pH value")
    rainfall: float = Field(..., description="Rainfall in mm")

class AlternativeCrop(BaseModel):
    crop: str
    confidence: float

class PredictResponse(BaseModel):
    recommended_crop: str
    alternatives: List[AlternativeCrop]
    care_tips: dict

class SuitabilityRequest(BaseModel):
    crop_name: str
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float

class SuitabilityParameter(BaseModel):
    name: str
    input_value: float
    ideal_mean: float
    ideal_min: float
    ideal_max: float
    score: float
    status: str  # 'Optimal', 'Low', 'High'
    message: str

class SuitabilityResponse(BaseModel):
    crop_name: str
    overall_score: float
    parameters: List[SuitabilityParameter]

# Helper functions to load ML artifacts
def load_ml_artifacts():
    try:
        with open("backend/crop_recommender.pkl", "rb") as f:
            model = pickle.load(f)
        with open("backend/scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        with open("backend/label_encoder.pkl", "rb") as f:
            le = pickle.load(f)
        with open("backend/crop_statistics.json", "r") as f:
            stats = json.load(f)
        with open("backend/crop_tips.json", "r") as f:
            tips = json.load(f)
        return model, scaler, le, stats, tips
    except Exception as e:
        # Fallback if executing from root or subdirectory
        try:
            with open("crop_recommender.pkl", "rb") as f:
                model = pickle.load(f)
            with open("scaler.pkl", "rb") as f:
                scaler = pickle.load(f)
            with open("label_encoder.pkl", "rb") as f:
                le = pickle.load(f)
            with open("crop_statistics.json", "r") as f:
                stats = json.load(f)
            with open("crop_tips.json", "r") as f:
                tips = json.load(f)
            return model, scaler, le, stats, tips
        except Exception as inner_e:
            raise RuntimeError(f"Failed to load ML artifacts: {e}. Inner: {inner_e}")

# Endpoints

@app.post("/predict", response_model=PredictResponse)
def predict(payload: PredictRequest, db: Session = Depends(get_db)):
    try:
        model, scaler, le, stats, tips = load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Scale input
    input_data = [[
        payload.N, payload.P, payload.K, 
        payload.temperature, payload.humidity, 
        payload.ph, payload.rainfall
    ]]
    scaled_data = scaler.transform(input_data)
    
    # Predict probabilities
    try:
        prob = model.predict_proba(scaled_data)[0]
        # Sort indices by probability descending
        sorted_indices = prob.argsort()[::-1]
        
        recommended_idx = sorted_indices[0]
        recommended_crop = le.inverse_transform([recommended_idx])[0]
        
        # Alternatives (top 3 next crops)
        alternatives = []
        for idx in sorted_indices[1:4]:
            crop_name = le.inverse_transform([idx])[0]
            confidence = float(prob[idx])
            alternatives.append(AlternativeCrop(crop=crop_name, confidence=confidence))
            
    except Exception as e:
        # Fallback if model doesn't support predict_proba (e.g. SVM without probability=True)
        pred = model.predict(scaled_data)[0]
        recommended_crop = le.inverse_transform([pred])[0]
        alternatives = []
        
    # Get care tips
    crop_tips = tips.get(recommended_crop, {
        "fertilizer": "No specific fertilizer tips available.",
        "watering": "No specific watering tips available.",
        "soil_care": "No specific soil care tips available.",
        "harvesting": "No specific harvesting tips available."
    })
    
    # Log prediction request to Database
    log_entry = PredictionLog(
        n=payload.N, p=payload.P, k=payload.K,
        temperature=payload.temperature, humidity=payload.humidity,
        ph=payload.ph, rainfall=payload.rainfall,
        recommended_crop=recommended_crop,
        query_type="recommendation"
    )
    db.add(log_entry)
    db.commit()
    
    return PredictResponse(
        recommended_crop=recommended_crop,
        alternatives=alternatives,
        care_tips=crop_tips
    )

@app.post("/suitability", response_model=SuitabilityResponse)
def suitability(payload: SuitabilityRequest, db: Session = Depends(get_db)):
    try:
        model, scaler, le, stats, tips = load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    crop = payload.crop_name.lower().strip()
    if crop not in stats:
        # Find closest match if user inputs slightly different casing/spacing
        matched = False
        for key in stats.keys():
            if key.lower() == crop:
                crop = key
                matched = True
                break
        if not matched:
            raise HTTPException(status_code=404, detail=f"Crop '{payload.crop_name}' is not in the dataset statistics.")
            
    crop_stats = stats[crop]
    params_to_check = {
        "N": payload.N,
        "P": payload.P,
        "K": payload.K,
        "temperature": payload.temperature,
        "humidity": payload.humidity,
        "ph": payload.ph,
        "rainfall": payload.rainfall
    }
    
    suitability_params = []
    total_score = 0.0
    
    for param_name, input_val in params_to_check.items():
        p_stats = crop_stats[param_name]
        mean_val = p_stats["mean"]
        std_val = p_stats["std"]
        min_val = p_stats["min"]
        max_val = p_stats["max"]
        
        # Calculate suitability score for this parameter using Gaussian decay
        # Width parameter is set to 1.5 * standard deviation
        width = 1.5 * std_val if std_val > 0 else 0.1 * mean_val
        if width == 0:
            width = 1.0
            
        z_score = (input_val - mean_val) / width
        param_score = math.exp(-0.5 * (z_score ** 2))
        
        # Status and Warning generation
        # Optimal defined as within 1.25 std of mean
        tolerance = 1.25 * std_val if std_val > 0 else 0.1 * mean_val
        if input_val < mean_val - tolerance:
            status = "Low"
            message = f"{param_name} is too low (ideal: {mean_val - tolerance:.1f} - {mean_val + tolerance:.1f})"
        elif input_val > mean_val + tolerance:
            status = "High"
            message = f"{param_name} is too high (ideal: {mean_val - tolerance:.1f} - {mean_val + tolerance:.1f})"
        else:
            status = "Optimal"
            message = f"{param_name} is in the optimal range"
            
        suitability_params.append(SuitabilityParameter(
            name=param_name,
            input_value=input_val,
            ideal_mean=mean_val,
            ideal_min=min_val,
            ideal_max=max_val,
            score=round(param_score * 100, 1),
            status=status,
            message=message
        ))
        total_score += param_score
        
    overall_score = round((total_score / len(params_to_check)) * 100, 1)
    
    # Log suitability request to Database
    log_entry = PredictionLog(
        n=payload.N, p=payload.P, k=payload.K,
        temperature=payload.temperature, humidity=payload.humidity,
        ph=payload.ph, rainfall=payload.rainfall,
        recommended_crop=crop,  # Store the target crop as the recommendation
        query_type="suitability",
        selected_crop=crop,
        suitability_score=overall_score
    )
    db.add(log_entry)
    db.commit()
    
    return SuitabilityResponse(
        crop_name=crop,
        overall_score=overall_score,
        parameters=suitability_params
    )

@app.get("/crops/{crop_name}/ideal-range")
def ideal_range(crop_name: str):
    try:
        model, scaler, le, stats, tips = load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    crop = crop_name.lower().strip()
    if crop not in stats:
        # Check casing
        matched = False
        for key in stats.keys():
            if key.lower() == crop:
                crop = key
                matched = True
                break
        if not matched:
            raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found.")
            
    return {
        "crop_name": crop,
        "ranges": stats[crop]
    }

@app.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db)):
    try:
        model, scaler, le, stats, tips = load_ml_artifacts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    # Fetch all logs
    logs = db.query(PredictionLog).order_back = db.query(PredictionLog).order_by(PredictionLog.timestamp.desc()).all()
    
    # 1. Total count
    total_queries = len(logs)
    
    # 2. Recommendations count
    recommendations = {}
    for log in logs:
        crop = log.recommended_crop
        recommendations[crop] = recommendations.get(crop, 0) + 1
        
    recommendation_distribution = [{"crop": k, "count": v} for k, v in recommendations.items()]
    
    # 3. Average input parameters
    avg_inputs = {}
    if total_queries > 0:
        avg_inputs = {
            "N": sum(l.n for l in logs) / total_queries,
            "P": sum(l.p for l in logs) / total_queries,
            "K": sum(l.k for l in logs) / total_queries,
            "temperature": sum(l.temperature for l in logs) / total_queries,
            "humidity": sum(l.humidity for l in logs) / total_queries,
            "ph": sum(l.ph for l in logs) / total_queries,
            "rainfall": sum(l.rainfall for l in logs) / total_queries,
        }
        
    # 4. Serialize logs for table (limit to 100 for performance)
    log_list = []
    for log in logs[:100]:
        log_list.append({
            "id": log.id,
            "N": log.n,
            "P": log.p,
            "K": log.k,
            "temperature": log.temperature,
            "humidity": log.humidity,
            "ph": log.ph,
            "rainfall": log.rainfall,
            "recommended_crop": log.recommended_crop,
            "query_type": log.query_type,
            "selected_crop": log.selected_crop,
            "suitability_score": log.suitability_score,
            "timestamp": log.timestamp.isoformat()
        })
        
    # 5. Crop ideal averages for quick reference
    crop_requirements = []
    for crop, f_stats in stats.items():
        crop_requirements.append({
            "crop": crop,
            "N": f_stats["N"]["mean"],
            "P": f_stats["P"]["mean"],
            "K": f_stats["K"]["mean"],
            "temperature": f_stats["temperature"]["mean"],
            "humidity": f_stats["humidity"]["mean"],
            "ph": f_stats["ph"]["mean"],
            "rainfall": f_stats["rainfall"]["mean"],
        })
        
    # Try to load model accuracy/feature importance
    model_summary = {}
    if os.path.exists("backend/model_summary.json"):
        with open("backend/model_summary.json", "r") as f:
            model_summary = json.load(f)
    elif os.path.exists("model_summary.json"):
        with open("model_summary.json", "r") as f:
            model_summary = json.load(f)
            
    return {
        "total_queries": total_queries,
        "recommendation_distribution": recommendation_distribution,
        "average_inputs": avg_inputs,
        "logs": log_list,
        "crop_requirements": crop_requirements,
        "model_summary": model_summary
    }

@app.get("/analytics/export")
def export_analytics(db: Session = Depends(get_db)):
    logs = db.query(PredictionLog).order_by(PredictionLog.timestamp.desc()).all()
    
    # Generate CSV in memory
    output = io.StringIO()
    writer = pd.DataFrame([{
        "id": log.id,
        "N": log.n,
        "P": log.p,
        "K": log.k,
        "temperature": log.temperature,
        "humidity": log.humidity,
        "ph": log.ph,
        "rainfall": log.rainfall,
        "recommended_crop": log.recommended_crop,
        "query_type": log.query_type,
        "selected_crop": log.selected_crop,
        "suitability_score": log.suitability_score,
        "timestamp": log.timestamp.isoformat()
    } for log in logs])
    
    if writer.empty:
        df = pd.DataFrame(columns=["id", "N", "P", "K", "temperature", "humidity", "ph", "rainfall", "recommended_crop", "query_type", "selected_crop", "suitability_score", "timestamp"])
    else:
        df = writer
        
    df.to_csv(output, index=False)
    output.seek(0)
    
    response = StreamingResponse(iter([output.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=opticrop_analytics_report.csv"
    return response

# Asynchronous model retraining
def retrain_model_task():
    try:
        from train import train_and_evaluate
        # Run training on standard csv
        train_and_evaluate()
        print("Model retrained successfully via API trigger.")
    except Exception as e:
        print(f"Error during async retraining task: {e}")

@app.post("/retrain")
def retrain(background_tasks: BackgroundTasks):
    background_tasks.add_task(retrain_model_task)
    return {"message": "Model retraining task started in background."}

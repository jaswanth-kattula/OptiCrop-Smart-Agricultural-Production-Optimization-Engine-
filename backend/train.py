import os
import json
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, accuracy_score, f1_score

def train_and_evaluate(csv_path="Crop_recommendation.csv", output_dir="backend"):
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading dataset from {csv_path}...")
    if not os.path.exists(csv_path):
        # Check parent directory as fallback
        fallback = os.path.join("..", csv_path)
        if os.path.exists(fallback):
            csv_path = fallback
        else:
            raise FileNotFoundError(f"Dataset not found at {csv_path}")
            
    df = pd.read_csv(csv_path)
    
    # 1. Calculate Crop-wise Statistics for Suitability Assessment
    print("Calculating crop-wise statistics...")
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    stats = {}
    
    for crop in df['label'].unique():
        crop_df = df[df['label'] == crop]
        stats[crop] = {}
        for feature in features:
            values = crop_df[feature].values
            stats[crop][feature] = {
                "min": float(np.min(values)),
                "max": float(np.max(values)),
                "mean": float(np.mean(values)),
                "std": float(np.std(values))
            }
            
    stats_path = os.path.join(output_dir, "crop_statistics.json")
    with open(stats_path, "w") as f:
        json.dump(stats, f, indent=4)
    print(f"Saved crop statistics to {stats_path}")
    
    # 2. Preprocess Data for ML Models
    X = df[features]
    y = df['label']
    
    # Encode target labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save the scaler and label encoder
    scaler_path = os.path.join(output_dir, "scaler.pkl")
    le_path = os.path.join(output_dir, "label_encoder.pkl")
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    with open(le_path, "wb") as f:
        pickle.dump(label_encoder, f)
    print(f"Saved scaler to {scaler_path} and label encoder to {le_path}")
    
    # 3. Model Comparison
    models = {
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42),
        "Support Vector Machine": SVC(probability=True, random_state=42)
    }
    
    best_model_name = None
    best_f1 = -1
    best_model = None
    results = {}
    
    print("\n--- Training and Comparing Models ---")
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds, average='weighted')
        
        results[name] = {
            "accuracy": float(acc),
            "f1_score": float(f1),
            "report": classification_report(y_test, preds, target_names=label_encoder.classes_, output_dict=True)
        }
        
        print(f"{name} - Accuracy: {acc:.4f}, Weighted F1: {f1:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model Selected: {best_model_name} (F1: {best_f1:.4f})")
    
    # 4. Save the Best Model
    model_path = os.path.join(output_dir, "crop_recommender.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(best_model, f)
    print(f"Saved best model to {model_path}")
    
    # Save model performance summary
    summary_path = os.path.join(output_dir, "model_summary.json")
    summary = {
        "best_model": best_model_name,
        "features": features,
        "results": results
    }
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=4)
        
    print(f"Saved training summary to {summary_path}")
    
    # Print Feature Importance if available
    if hasattr(best_model, 'feature_importances_'):
        print("\nFeature Importances:")
        for feat, imp in zip(features, best_model.feature_importances_):
            print(f"  {feat}: {imp:.4f}")
            
    return best_model_name, best_f1

if __name__ == "__main__":
    train_and_evaluate()

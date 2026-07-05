# OptiCrop – Smart Agricultural Production Optimization Engine

OptiCrop is an AI-powered agricultural optimizer that recommends the most suitable crop for a field based on soil and weather parameters. It features a farmer recommendation interface, a soil suitability evaluator, and a research dashboard logging every model inquiry to SQLite database for region-wide planning.

---

## Technical Architecture & Stack

- **Backend**: Python 3.11, FastAPI
- **Machine Learning**: Scikit-Learn, XGBoost, Pandas, NumPy
- **Database**: SQLite with SQLAlchemy ORM (logs N-P-K, climate inputs, predicted crop, suitability scores, and timestamps)
- **Frontend**: React (Vite), Tailwind CSS v3, Recharts (for analytics and spider/radar layouts)

---

## Machine Learning & Model Performance

The classification model was trained on the standard **Crop Recommendation Dataset** containing 2,200 records mapping soil and weather parameters to 22 common crops (rice, maize, chickpea, cotton, coffee, banana, mango, grapes, etc.).

We compared three classification algorithms (using 80-20 stratified training split):

1. **Random Forest Classifier**:
   - **Accuracy**: 99.55%
   - **Weighted F1-Score**: 99.55%
   - *Status: Selected & Deployed*
2. **XGBoost Classifier**:
   - **Accuracy**: 99.32%
   - **Weighted F1-Score**: 99.31%
3. **Support Vector Machine (SVM)**:
   - **Accuracy**: 98.41%
   - **Weighted F1-Score**: 98.40%

### Feature Weight Importance (Random Forest Profile)
- **Rainfall**: 23.02%
- **Humidity**: 22.42%
- **Potassium (K)**: 17.54%
- **Phosphorus (P)**: 15.08%
- **Nitrogen (N)**: 9.64%
- **Temperature**: 7.24%
- **Soil pH**: 5.06%

---

## Setup & Running Instructions

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### 1. Backend Setup
Navigate to the `backend` folder and run:
```bash
cd backend

# Create python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Windows CMD:
.\venv\Scripts\activate.bat
# On Linux / macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run model training script to generate pickles and crop stats
python train.py

# Start the FastAPI server locally
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
The FastAPI documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
Open a new terminal session, navigate to the `frontend` folder, and run:
```bash
cd frontend

# Install Vite React packages
npm install

# Install Tailwind and Chart libraries
npm install -D tailwindcss@3 postcss autoprefixer
npm install lucide-react recharts

# Start the Vite local host server
npm run dev
```
The application will load at `http://localhost:5173/`.

---

## API Endpoints Documentation

- **`POST /predict`**
  - **Description**: Recommends the optimal crop for the input soil and weather values. Logs inquiry in the SQLite registry.
  - **Request Body**:
    ```json
    {
      "N": 90, "P": 42, "K": 43,
      "temperature": 20.8, "humidity": 82.0, "ph": 6.5, "rainfall": 202.9
    }
    ```
  - **Response**:
    ```json
    {
      "recommended_crop": "rice",
      "alternatives": [
        { "crop": "jute", "confidence": 0.05 },
        { "crop": "papaya", "confidence": 0.02 }
      ],
      "care_tips": {
        "fertilizer": "Apply Nitrogen-rich fertilizers in split doses...",
        "watering": "Maintain standing water (5-10 cm)...",
        "soil_care": "Clayey or clay loam soils that retain moisture...",
        "harvesting": "Harvest when 80-85% of grains turn straw-colored..."
      }
    }
    ```

- **`POST /suitability`**
  - **Description**: Analyzes how well a selected crop fits the inputted parameters. Employs Gaussian decay mapping from the crop's statistical mean requirements. Logs inquiry.
  - **Request Body**:
    ```json
    {
      "crop_name": "rice",
      "N": 80, "P": 40, "K": 40,
      "temperature": 21.0, "humidity": 80.0, "ph": 6.0, "rainfall": 180.0
    }
    ```
  - **Response**:
    ```json
    {
      "crop_name": "rice",
      "overall_score": 98.4,
      "parameters": [
        {
          "name": "N",
          "input_value": 80.0,
          "ideal_mean": 79.8,
          "ideal_min": 60.0,
          "ideal_max": 99.0,
          "score": 99.9,
          "status": "Optimal",
          "message": "N is in the optimal range"
        },
        ...
      ]
    }
    ```

- **`GET /crops/{crop_name}/ideal-range`**
  - **Description**: Retrieves historical statistical metrics ($\min$, $\max$, $\mu$, $\sigma$) for a crop.
  - **Response**:
    ```json
    {
      "crop_name": "rice",
      "ranges": {
        "N": { "min": 60.0, "max": 99.0, "mean": 79.89, "std": 11.23 },
        ...
      }
    }
    ```

- **`GET /analytics/summary`**
  - **Description**: Fetches aggregations across database inquiry logs, features importances, crop optimal averages, and recent transaction log entries.

- **`GET /analytics/export`**
  - **Description**: Streams the full SQLite transaction database logs as an exportable CSV report.

- **`POST /retrain`**
  - **Description**: Triggers model training asynchronously in the background.

---

## Directory Organization

```
/
├── Crop_recommendation.csv    # Primary training dataset
├── README.md                  # Setup & technical manual
├── notebooks/
│   └── eda_and_model_comparison.ipynb  # Jupyter notebook (EDA & Model Selection)
├── backend/
│   ├── main.py                # FastAPI routes & suitability algorithms
│   ├── train.py               # Model training script
│   ├── db.py                  # SQLAlchemy schema setup
│   ├── crop_tips.json         # Static care instructions dictionary
│   ├── requirements.txt       # Python backend dependencies
│   └── opticrop.db            # Local SQLite database (auto-generated)
└── frontend/
    ├── package.json           # Frontend packages mapping
    ├── tailwind.config.js     # Tailwind CSS theme configuration
    ├── postcss.config.js      # PostCSS compilation setups
    ├── index.html             # React Vite HTML entry
    └── src/
        ├── index.css          # Core CSS stylesheet
        ├── main.jsx           # React app renderer
        ├── App.jsx            # Layout navigation controller
        └── pages/
            ├── LandingPage.jsx          # UI Splash screen
            ├── FarmerRecommendation.jsx # Soil-analysis inputs
            ├── SuitabilityChecker.jsx   # Spider chart comparison
            └── ResearchDashboard.jsx    # Analytics metric viewer
```

---

## Uploading to GitHub & Deployment

To upload and deploy OptiCrop publicly on GitHub, follow the steps below:

### 1. Push Code to GitHub
Initialize a git repository in the root workspace folder, commit all files, and push to your new GitHub repository:
```bash
# Initialize git
git init

# Add all files (the root .gitignore automatically excludes database records, node_modules, and venv)
git add .

# Initial commit
git commit -m "feat: initial commit of OptiCrop engine with ML model, FastAPI, and light theme"

# Link to your remote GitHub repo
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

### 2. Deploying the Backend
Since the backend uses a Python FastAPI runtime and SQLite, you can deploy it to platforms like **Render**, **Railway**, or **Hugging Face Spaces**:
- **Render Deployment Steps**:
  1. Create a new **Web Service** on Render and connect your GitHub repository.
  2. Set **Runtime** to `Python 3`.
  3. Set **Build Command** to: `pip install -r backend/requirements.txt && python backend/train.py`
  4. Set **Start Command** to: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
  5. Copy your deployed web service URL (e.g. `https://opticrop-backend.onrender.com`).

### 3. Deploying the Frontend to GitHub Pages
To host the React interface on GitHub Pages:
1. Open `frontend/package.json` and add `gh-pages` helper scripts:
   - Install `gh-pages` package: `npm install --save-dev gh-pages`
   - Add scripts in `frontend/package.json`:
     ```json
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
     ```
2. Build the app with your deployed backend URL. Run the command:
   ```bash
   # In Windows PowerShell/Bash (run from the /frontend directory):
   $env:VITE_API_URL="https://YOUR_BACKEND_SERVICE_URL"
   npm run build
   ```
3. Deploy the build output to the `gh-pages` branch:
   ```bash
   npm run deploy
   ```
Alternatively, you can drag and drop the `frontend/dist` folder into a **Vercel** or **Netlify** project dashboard and configure the `VITE_API_URL` environment variable in their settings panel for an instant, free static hosting deployment.


import React, { useState } from 'react';
import { ShieldAlert, Info, Loader2, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { API_BASE_URL } from '../config';

const CROPS = [
  'rice', 'maize', 'chickpea', 'kidneybeans', 'pigeonpies', 'mothbeans',
  'mungbean', 'blackgram', 'lentil', 'pomegranate', 'banana', 'mango',
  'grapes', 'watermelon', 'muskmelon', 'apple', 'orange', 'papaya',
  'coconut', 'cotton', 'jute', 'coffee'
];

export default function SuitabilityChecker() {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [inputs, setInputs] = useState({
    N: '', P: '', K: '',
    temperature: '', humidity: '', ph: '', rainfall: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setInputs({ N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '' });
    setResult(null);
    setError(null);
  };

  const handleFillIdeal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/crops/${selectedCrop}/ideal-range`);
      if (!response.ok) throw new Error('Failed to fetch ideal ranges.');
      const data = await response.json();
      
      // Auto-fill inputs with the ideal mean values
      setInputs({
        N: Math.round(data.ranges.N.mean).toString(),
        P: Math.round(data.ranges.P.mean).toString(),
        K: Math.round(data.ranges.K.mean).toString(),
        temperature: data.ranges.temperature.mean.toFixed(1),
        humidity: data.ranges.humidity.mean.toFixed(1),
        ph: data.ranges.ph.mean.toFixed(1),
        rainfall: data.ranges.rainfall.mean.toFixed(1)
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch ideal ranges.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { crop_name: selectedCrop };
    for (const [key, val] of Object.entries(inputs)) {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        setError(`Please enter a valid number for ${key}.`);
        setLoading(false);
        return;
      }
      payload[key] = parsed;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/suitability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze suitability.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server connection failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Process data for the Radar Chart
  // We normalize variables so they share the same scale:
  // ideal_mean is mapped to 50. Everything else is relative.
  const getRadarData = () => {
    if (!result) return [];
    return result.parameters.map(p => {
      const scale = p.ideal_mean > 0 ? p.ideal_mean : 1;
      return {
        parameter: p.name,
        Input: Math.min(100, (p.input_value / scale) * 50),
        Ideal: 50,
        Min: Math.min(100, (p.ideal_min / scale) * 50),
        Max: Math.min(100, (p.ideal_max / scale) * 50),
        rawInput: p.input_value,
        rawIdeal: p.ideal_mean,
        rawMin: p.ideal_min,
        rawMax: p.ideal_max
      };
    });
  };

  const radarData = getRadarData();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-3">
          <ShieldAlert className="w-8 h-8 text-earth-600" />
          Crop Suitability Assessment
        </h1>
        <p className="text-slate-500 mt-2">
          Select a target crop and input your soil characteristics to evaluate match parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Column (5 cols) */}
        <div className="lg:col-span-5 glass rounded-2xl p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Target & Parameters</h2>
            <button 
              type="button" 
              onClick={handleReset}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target Crop Selection */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-earth-600 block mb-2">Target Crop</label>
              <div className="flex gap-2">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="flex-grow bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 capitalize text-sm cursor-pointer"
                >
                  {CROPS.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleFillIdeal}
                  disabled={loading}
                  className="text-xs px-3 py-2 rounded-lg border border-earth-200 bg-earth-50 text-earth-700 hover:bg-earth-100 hover:text-earth-800 transition-colors cursor-pointer"
                  title="Auto-fill form inputs with ideal requirements for the selected crop"
                >
                  Auto-Fill Ideal
                </button>
              </div>
            </div>

            {/* Soil Macronutrients */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest-600 mb-3">Soil Nutrients (mg/kg)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nitrogen (N)</label>
                  <input
                    type="number" step="any" required name="N" value={inputs.N} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Phosphorus (P)</label>
                  <input
                    type="number" step="any" required name="P" value={inputs.P} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Potassium (K)</label>
                  <input
                    type="number" step="any" required name="K" value={inputs.K} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Conditions */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-earth-600 mb-3">Weather & Climate</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Temperature (°C)</label>
                    <input
                      type="number" step="any" required name="temperature" value={inputs.temperature} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                      placeholder="e.g. 25.0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Humidity (%)</label>
                    <input
                      type="number" step="any" required name="humidity" value={inputs.humidity} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                      placeholder="e.g. 60.0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Soil pH</label>
                    <input
                      type="number" step="any" required name="ph" value={inputs.ph} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                      placeholder="e.g. 6.0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Rainfall (mm)</label>
                    <input
                      type="number" step="any" required name="rainfall" value={inputs.rainfall} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-earth-500 focus:ring-1 focus:ring-earth-500 text-sm"
                      placeholder="e.g. 100.0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-earth-600 hover:bg-earth-700 active:bg-earth-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-earth-500/10 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching Assessment...
                </>
              ) : (
                'Assess Suitability'
              )}
            </button>
          </form>
        </div>

        {/* Right Content Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="glass rounded-2xl p-12 text-center border-slate-200 flex flex-col items-center justify-center min-h-[450px]">
              <ShieldAlert className="w-16 h-16 text-slate-300 mb-4 stroke-1" />
              <h3 className="text-lg font-semibold text-slate-500">Awaiting Suitability Parameters</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm">
                Select a crop and input the specifications, then click 'Assess Suitability' to compare variables against standard baselines.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass rounded-2xl p-12 text-center border-slate-200 flex flex-col items-center justify-center min-h-[450px]">
              <Loader2 className="w-12 h-12 text-earth-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Calculating Suitability Profile...</h3>
              <p className="text-slate-500 text-xs mt-2">
                Evaluating parameters via Gaussian decay distance metrics from the dataset mean requirements.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Suitability Score Header Card */}
              <div className="glass rounded-2xl p-6 border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assessment Result</h3>
                  <h2 className="text-3xl font-extrabold text-slate-900 capitalize mt-1">
                    {result.crop_name} Suitability
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 max-w-md">
                    The suitability score reflects the weighted distance of inputs from the ideal environment. 100% indicates a perfect match.
                  </p>
                </div>
                {/* Circular Gauge */}
                <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56" cy="56" r="48"
                      className="stroke-slate-100 fill-none"
                      strokeWidth="8"
                    />
                    <circle
                      cx="56" cy="56" r="48"
                      className="fill-none transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={(1 - result.overall_score / 100) * 2 * Math.PI * 48}
                      strokeLinecap="round"
                      stroke={
                        result.overall_score >= 80 ? '#10b981' : // Emerald
                        result.overall_score >= 50 ? '#f59e0b' : // Amber
                        '#ef4444' // Red
                      }
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-extrabold text-slate-950">{result.overall_score}%</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Match</span>
                  </div>
                </div>
              </div>

              {/* Spider/Radar Chart */}
              <div className="glass rounded-2xl p-6 border-slate-200/80">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Parameter Spider Chart (Normalized)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="parameter" stroke="#475569" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={4} stroke="#cbd5e1" fontSize={9} />
                      <Radar name="Input Values" dataKey="Input" stroke="#c17f3d" fill="#c17f3d" fillOpacity={0.25} />
                      <Radar name="Ideal Target" dataKey="Ideal" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-slate-200 shadow-md p-3 rounded-lg text-xs space-y-1 text-slate-800">
                                <p className="font-bold text-slate-900 capitalize">{data.parameter} Values</p>
                                <p className="text-earth-750 font-semibold">Input: {data.rawInput.toFixed(1)}</p>
                                <p className="text-emerald-700 font-semibold">Ideal Mean: {data.rawIdeal.toFixed(1)}</p>
                                <p className="text-slate-500">Ideal Range: {data.rawMin.toFixed(1)} - {data.rawMax.toFixed(1)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Parameter Table & Warnings */}
              <div className="glass rounded-2xl p-6 border-slate-200/80 overflow-hidden">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Parameter Validation & Warnings</h3>
                <div className="space-y-3">
                  {result.parameters.map((param, index) => (
                    <div 
                      key={index}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                        param.status === 'Optimal' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                        param.status === 'Low' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                        'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {param.status === 'Optimal' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> :
                         param.status === 'Low' ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> :
                         <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase">{param.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{param.message}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold block text-slate-400">Match score</span>
                        <span className="text-sm font-extrabold text-slate-950">{param.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

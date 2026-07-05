import React, { useState } from 'react';
import { Sprout, HelpCircle, Loader2, RefreshCw, Flame, Droplet, Heart, CheckCircle2, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';

const PRESETS = {
  rice: { name: 'Rice Environment', N: 90, P: 42, K: 43, temperature: 21.0, humidity: 82.0, ph: 6.5, rainfall: 202.9 },
  coffee: { name: 'Coffee Environment', N: 100, P: 30, K: 30, temperature: 25.5, humidity: 55.0, ph: 5.5, rainfall: 150.0 },
  cotton: { name: 'Cotton Environment', N: 120, P: 40, K: 20, temperature: 23.9, humidity: 80.2, ph: 7.5, rainfall: 82.5 }
};

export default function FarmerRecommendation() {
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

  const applyPreset = (presetKey) => {
    const p = PRESETS[presetKey];
    setInputs({
      N: p.N.toString(),
      P: p.P.toString(),
      K: p.K.toString(),
      temperature: p.temperature.toString(),
      humidity: p.humidity.toString(),
      ph: p.ph.toString(),
      rainfall: p.rainfall.toString()
    });
  };

  const handleReset = () => {
    setInputs({ N: '', P: '', K: '', temperature: '', humidity: '', ph: '', rainfall: '' });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that inputs are numbers
    const payload = {};
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
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate prediction.');
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-3">
          <Sprout className="w-8 h-8 text-forest-600" />
          Smart Crop Recommendation
        </h1>
        <p className="text-slate-500 mt-2">
          Submit your soil macronutrients and weather variables to determine the most viable crop.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 glass rounded-2xl p-6 border-slate-200/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Soil & Weather Inputs</h2>
            <button 
              type="button" 
              onClick={handleReset}
              className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* Quick Presets with warm earth details */}
          <div className="mb-6">
            <label className="text-xs text-slate-400 block mb-2 font-bold uppercase tracking-wider">Quick Test Presets</label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(PRESETS).map(presetKey => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => applyPreset(presetKey)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 hover:border-earth-400 text-stone-700 hover:text-earth-800 transition-colors cursor-pointer"
                >
                  {PRESETS[presetKey].name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Soil Macronutrients */}
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest-600 mb-3">Soil Nutrients (mg/kg)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Nitrogen (N)</label>
                  <input
                    type="number" step="any" required name="N" value={inputs.N} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                    placeholder="e.g. 80"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Phosphorus (P)</label>
                  <input
                    type="number" step="any" required name="P" value={inputs.P} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                    placeholder="e.g. 45"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Potassium (K)</label>
                  <input
                    type="number" step="any" required name="K" value={inputs.K} onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                    placeholder="e.g. 40"
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
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                      placeholder="e.g. 24.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Humidity (%)</label>
                    <input
                      type="number" step="any" required name="humidity" value={inputs.humidity} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                      placeholder="e.g. 80"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Soil pH</label>
                    <input
                      type="number" step="any" required name="ph" value={inputs.ph} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                      placeholder="e.g. 6.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Rainfall (mm)</label>
                    <input
                      type="number" step="any" required name="rainfall" value={inputs.rainfall} onChange={handleInputChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500 text-sm"
                      placeholder="e.g. 150"
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
              className="w-full bg-forest-600 hover:bg-forest-700 active:bg-forest-800 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-forest-500/10 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Soil...
                </>
              ) : (
                'Generate Recommendation'
              )}
            </button>
          </form>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="glass rounded-2xl p-12 text-center border-slate-200 flex flex-col items-center justify-center min-h-[420px]">
              <Sprout className="w-16 h-16 text-slate-300 mb-4 stroke-1" />
              <h3 className="text-lg font-semibold text-slate-500">Awaiting Soil Analysis</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm">
                Fill in the environment parameters or apply a quick preset, then submit the form to invoke the AI predictive engine.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass rounded-2xl p-12 text-center border-slate-200 flex flex-col items-center justify-center min-h-[420px]">
              <Loader2 className="w-12 h-12 text-forest-500 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-700">Predicting Optimum Crop...</h3>
              <p className="text-slate-500 text-xs mt-2">
                Running Random Forest Classifier model on features scaled with standard parameters.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Top Crop Card */}
              <div className="glass-emerald rounded-2xl p-6 border-emerald-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Sprout className="w-32 h-32 text-emerald-600" />
                </div>
                <div className="flex items-center gap-2.5 text-xs text-emerald-700 font-bold uppercase tracking-widest mb-1">
                  <CheckCircle2 className="w-4 h-4" /> Top Recommendation
                </div>
                <h2 className="text-3xl font-extrabold text-emerald-950 capitalize">
                  {result.recommended_crop}
                </h2>
                <p className="text-xs text-emerald-800 mt-2 max-w-md">
                  This crop is best suited for your parameters. Below are dynamic fertilizer, irrigation, and harvesting instructions.
                </p>
              </div>

              {/* Care Tips Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-xl p-5 border-slate-200/80">
                  <h4 className="text-xs font-bold text-forest-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-600" /> Fertilizer & Nutrients
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.care_tips.fertilizer}
                  </p>
                </div>
                <div className="glass rounded-xl p-5 border-slate-200/80">
                  <h4 className="text-xs font-bold text-forest-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-blue-600" /> Irrigation & Watering
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.care_tips.watering}
                  </p>
                </div>
                <div className="glass rounded-xl p-5 border-slate-200/80">
                  <h4 className="text-xs font-bold text-forest-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-emerald-600" /> Soil Preparation
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.care_tips.soil_care}
                  </p>
                </div>
                <div className="glass rounded-xl p-5 border-slate-200/80">
                  <h4 className="text-xs font-bold text-forest-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-600" /> Harvesting Schedule
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.care_tips.harvesting}
                  </p>
                </div>
              </div>

              {/* Alternative Crops (Confidence Scores) */}
              {result.alternatives && result.alternatives.length > 0 && (
                <div className="glass rounded-2xl p-6 border-slate-200/80">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Top Alternative Suggestions</h3>
                  <div className="space-y-4">
                    {result.alternatives.map((alt, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize text-slate-700">{alt.crop}</span>
                          <span className="text-slate-500">{(alt.confidence * 100).toFixed(1)}% match</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 border border-slate-200 overflow-hidden">
                          <div 
                            className="bg-forest-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${alt.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

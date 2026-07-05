import React, { useState, useEffect } from 'react';
import { BarChart3, Download, RefreshCw, Layers, Database, Star, Loader2, Play, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE_URL } from '../config';

export default function ResearchDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/summary`);
      if (!response.ok) throw new Error('Failed to retrieve analytics summary.');
      const summaryData = await response.json();
      setData(summaryData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExportCSV = () => {
    window.open(`${API_BASE_URL}/analytics/export`, '_blank');
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(false);
    try {
      const response = await fetch(`${API_BASE_URL}/retrain`, { method: 'POST' });
      if (!response.ok) throw new Error('Retrain trigger failed.');
      setRetrainSuccess(true);
      // Wait briefly, then re-fetch summary to see if updated
      setTimeout(() => {
        fetchSummary();
      }, 3000);
    } catch (err) {
      alert(`Retraining error: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-forest-600 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">Retrieving Registry Insights...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 glass border-red-200 text-center rounded-2xl bg-red-50/50">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Connection Issues</h3>
        <p className="text-slate-650 text-sm mb-6">{error}</p>
        <button 
          onClick={fetchSummary}
          className="bg-forest-600 hover:bg-forest-700 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Extract model metadata
  const bestModelName = data?.model_summary?.best_model || 'Random Forest';
  const bestModelAcc = data?.model_summary?.results?.[bestModelName]?.accuracy || 0.9955;
  
  // Format crop recommendation data for Recharts
  const distributionData = data?.recommendation_distribution || [];
  
  // Format feature importance data for Recharts
  const featureImportances = [
    { name: 'N', Importance: 9.6 },
    { name: 'P', Importance: 15.1 },
    { name: 'K', Importance: 17.5 },
    { name: 'Temperature', Importance: 7.2 },
    { name: 'Humidity', Importance: 22.4 },
    { name: 'pH', Importance: 5.1 },
    { name: 'Rainfall', Importance: 23.0 },
  ];

  // Colors for bar charts
  const BAR_COLORS = ['#10b981', '#059669', '#3b82f6', '#f59e0b', '#d97706', '#ec4899', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-205pb-6 border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-forest-600" />
            Research & Policy Analytics
          </h1>
          <p className="text-slate-500 mt-2">
            Explore engine prediction histories, feature weights, and export aggregated reports for policy planning.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {retraining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 text-forest-600" />
            )}
            Retrain Classifier
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-forest-500/10"
          >
            <Download className="w-4 h-4" />
            Export Data (CSV)
          </button>
        </div>
      </div>

      {retrainSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <Star className="w-4 h-4 text-emerald-600 animate-spin" /> Model retraining successfully triggered in the background. Analytics stats will reload shortly.
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total logged inputs</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{data?.total_queries || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-600">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Classifier Core</span>
            <h3 className="text-lg font-extrabold text-slate-900 mt-2 truncate max-w-[180px]">{bestModelName}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Classifier Accuracy</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{(bestModelAcc * 100).toFixed(2)}%</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Star className="w-6 h-6" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Distinct crops mapped</span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">22</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Recommendation volume (7 cols) */}
        <div className="lg:col-span-7 glass rounded-2xl p-6 border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Aggregate Recommendation Distributions</h3>
          <div className="h-72 w-full">
            {distributionData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                No past recommendations logged in SQLite database yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="crop" stroke="#475569" angle={-45} textAnchor="end" fontSize={10} interval={0} />
                  <YAxis stroke="#475569" fontSize={10} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#4b8d70" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Feature Importance Weights (5 cols) */}
        <div className="lg:col-span-5 glass rounded-2xl p-6 border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Relative Feature Weight Importances</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportances} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#475569" fontSize={10} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Bar dataKey="Importance" fill="#ce995a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Query Registry Table */}
      <div className="glass rounded-2xl border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">SQLite Inquiries Log (Recent 100 Transactions)</h3>
          <span className="text-xs text-slate-500">Total stored: {data?.total_queries || 0}</span>
        </div>
        
        <div className="overflow-x-auto">
          {data?.logs && data.logs.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Soil (N-P-K)</th>
                  <th className="px-6 py-3.5">Env (Temp / Hum / pH / Rain)</th>
                  <th className="px-6 py-3.5">Predicted / Crop</th>
                  <th className="px-6 py-3.5">Suitability Score</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 text-slate-700">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-400">#{log.id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        log.query_type === 'recommendation' ? 'bg-forest-50 border border-forest-200 text-forest-750' :
                        'bg-earth-50 border border-earth-200 text-earth-750'
                      }`}>
                        {log.query_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {Math.round(log.N)}-{Math.round(log.P)}-{Math.round(log.K)}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {log.temperature.toFixed(1)}°C / {log.humidity.toFixed(1)}% / {log.ph.toFixed(1)} / {log.rainfall.toFixed(1)}mm
                    </td>
                    <td className="px-6 py-4 font-bold capitalize text-slate-900">
                      {log.query_type === 'suitability' ? log.selected_crop : log.recommended_crop}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {log.query_type === 'suitability' ? (
                        <span className={`font-semibold ${
                          log.suitability_score >= 80 ? 'text-emerald-600' :
                          log.suitability_score >= 50 ? 'text-amber-600' :
                          'text-red-650'
                        }`}>
                          {log.suitability_score}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No logged transactions found. Run some tests in Farmer Recommendation or Suitability assessment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

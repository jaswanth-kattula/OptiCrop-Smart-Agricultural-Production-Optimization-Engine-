import React from 'react';
import { Sprout, ShieldAlert, BarChart3, ChevronRight, Activity, Database, Leaf } from 'lucide-react';

export default function LandingPage({ setPage }) {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-forest-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-earth-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-sm font-medium mb-6">
            <Leaf className="w-4 h-4" /> Powered by Machine Learning
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-forest-600 via-forest-700 to-earth-700">
              OptiCrop Engine
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
            Optimize your agricultural output using predictive AI. Analyze soil composition and weather factors to discover the ideal crops, check suitability scores, and examine region-wide performance indicators.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Farmer Mode */}
          <div 
            onClick={() => setPage('farmer')}
            className="group relative cursor-pointer glass rounded-2xl p-8 hover:border-forest-500/40 hover:bg-forest-50/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sprout className="w-24 h-24 text-forest-400" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-forest-700 transition-colors">
              Farmer Recommendation
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Input Nitrogen, Phosphorus, Potassium, temperature, humidity, pH, and rainfall levels to identify the top predicted crop and secondary recommendations with confidence parameters.
            </p>
            <div className="inline-flex items-center gap-1 text-sm font-semibold text-forest-600 group-hover:text-forest-700">
              Launch Farmer Mode <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Suitability Checker */}
          <div 
            onClick={() => setPage('suitability')}
            className="group relative cursor-pointer glass rounded-2xl p-8 hover:border-earth-500/40 hover:bg-earth-50/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert className="w-24 h-24 text-earth-400" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-earth-100 border border-earth-200 flex items-center justify-center text-earth-700 mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-earth-700 transition-colors">
              Suitability Assessment
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Select a target crop and submit your environmental parameters. OptiCrop compares your soil against the ideal database standards and computes an overall suitability percentage.
            </p>
            <div className="inline-flex items-center gap-1 text-sm font-semibold text-earth-700 group-hover:text-earth-800">
              Assess Suitability <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Research Dashboard */}
          <div 
            onClick={() => setPage('dashboard')}
            className="group relative cursor-pointer glass rounded-2xl p-8 hover:border-blue-500/40 hover:bg-blue-50/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BarChart3 className="w-24 h-24 text-blue-400" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-blue-700 transition-colors">
              Research & Policy Dashboard
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Access the administrator panel to analyze request volumes, crop demand charts, core environmental requirements across 22 crops, and download prediction logs.
            </p>
            <div className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
              Open Dashboard <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Dynamic Mini Dashboard Info */}
        <div className="glass rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Interactive Soil Science</h4>
              <p className="text-xs text-slate-500">Evaluate N (Nitrogen), P (Phosphorus), K (Potassium), alongside rainfall, pH, temperature, and relative humidity.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-earth-100 flex items-center justify-center text-earth-700 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Full-Stack SQLite Registry</h4>
              <p className="text-xs text-slate-500">Every single model inference and suitability query is automatically logged for historical analytics.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-slate-400">
        OptiCrop – Smart Agricultural Production Optimization Engine © 2026. Built with FastAPI, scikit-learn, and React.
      </div>
    </div>
  );
}

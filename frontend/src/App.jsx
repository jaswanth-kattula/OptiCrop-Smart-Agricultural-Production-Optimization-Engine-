import React, { useState } from 'react';
import { Sprout, ShieldAlert, BarChart3, Leaf, Home } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import FarmerRecommendation from './pages/FarmerRecommendation';
import SuitabilityChecker from './pages/SuitabilityChecker';
import ResearchDashboard from './pages/ResearchDashboard';

export default function App() {
  const [page, setPage] = useState('landing');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass border-b border-slate-200 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              onClick={() => setPage('landing')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-forest-500/10 border border-forest-500/20 flex items-center justify-center text-forest-600 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 group-hover:text-forest-600 transition-colors">
                  OptiCrop
                </span>
                <span className="hidden sm:inline text-[10px] text-slate-500 font-bold tracking-widest uppercase block -mt-1">
                  Optimization Engine
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setPage('landing')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  page === 'landing' 
                    ? 'bg-forest-100/60 text-forest-700 border border-forest-200/50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Home</span>
              </button>
              
              <button
                onClick={() => setPage('farmer')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  page === 'farmer' 
                    ? 'bg-forest-100/60 text-forest-700 border border-forest-200/50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>Farmer Mode</span>
              </button>

              <button
                onClick={() => setPage('suitability')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  page === 'suitability' 
                    ? 'bg-earth-100/60 text-earth-800 border border-earth-200/50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Suitability</span>
              </button>

              <button
                onClick={() => setPage('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  page === 'dashboard' 
                    ? 'bg-blue-100/60 text-blue-700 border border-blue-200/50' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-grow">
        {page === 'landing' && <LandingPage setPage={setPage} />}
        {page === 'farmer' && <FarmerRecommendation />}
        {page === 'suitability' && <SuitabilityChecker />}
        {page === 'dashboard' && <ResearchDashboard />}
      </main>
    </div>
  );
}

// Simple Working Landing Page
// Minimal, clean, and guaranteed to work

import React from 'react';

const SimpleWorkingLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Simple hero section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-16">
            {/* Main headline */}
            <h1 className="leading-tight">
              <div className="block text-7xl md:text-8xl font-bold text-white">
                Forge your coding skills.
              </div>
              <div className="block text-7xl md:text-8xl font-bold text-white mt-4">
                  One problem at a time.
                </div>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Master data structures, algorithms, and competitive programming with AI-powered assistance and real-time contests.
            </p>
            
            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="px-12 py-6 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-300">
                Start Coding
              </button>
              
              <button className="px-12 py-6 bg-white text-black font-bold text-lg rounded-xl border border-gray-300 hover:bg-gray-100 transition-all duration-300">
                Explore Problems
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Simple footer */}
      <footer className="bg-gray-900 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <p className="text-sm">
              © 2024 CodeForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleWorkingLanding;

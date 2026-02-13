// Minimal Working Hero Section
// Only uses SimpleMagneticBackground to ensure it works

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SimpleMagneticBackground from '../components/SimpleMagneticBackground';

const MinimalHero: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      <SimpleMagneticBackground />
      
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center space-y-16"
          >
            {/* Main headline */}
            <div className="space-y-8">
              <h1 className="leading-tight">
                <div className="block text-7xl md:text-8xl font-bold text-white">
                  Forge your coding skills.
                </div>
                <div className="block text-7xl md:text-8xl font-bold text-white mt-4">
                  One problem at a time.
                </div>
              </h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Master data structures, algorithms, and competitive programming with 
                <span className="text-blue-400 font-medium">AI-powered assistance</span> 
                {' '}and real-time contests.
              </motion.p>
            </div>
            
            {/* CTA buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-6 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/50 hover:shadow-blue-600/40 transition-all duration-300"
              >
                Start Coding
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-6 bg-white text-black font-bold text-lg rounded-xl border border-gray-300 hover:bg-gray-100 transition-all duration-300"
              >
                Explore Problems
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default MinimalHero;

// Stunning Hero Section
// Premium typography, glassmorphism, and impressive effects

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import UltraSimpleBackground from '../components/UltraSimpleBackground';

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

const StunningHero: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const words = ['Master', 'Create', 'Solve', 'Build', 'Deploy'];
  const features: FeatureCard[] = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Execute code instantly with our optimized runtime environment',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🎯',
      title: 'Precise Feedback',
      description: 'Get detailed insights on your code performance',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🏆',
      title: 'Compete & Win',
      description: 'Join contests and climb the global leaderboard',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get intelligent hints and optimization suggestions',
      gradient: 'from-green-500 to-teal-500'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      <SimpleMagneticBackground />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-8 left-8 z-20"
        >
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">Live</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-8 right-8 z-20"
        >
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full border border-white/20">
            <span className="text-sm font-medium">✨ AI Enhanced</span>
          </div>
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center space-y-12"
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
            >
              <span className="text-2xl animate-spin-slow">⚡</span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-300">Next-Gen</div>
                <div className="text-lg font-bold text-white">Coding Platform</div>
              </div>
            </motion.div>

            {/* Stunning Headline */}
            <div className="space-y-6">
              <h1 className="leading-tight tracking-tight">
                <div className="block text-6xl md:text-8xl lg:text-9xl font-black">
                  <motion.span
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                    style={{
                      backgroundSize: '200% 200%',
                      animation: 'gradient-flow 4s ease-in-out infinite'
                    }}
                  >
                    {words[currentWordIndex]}
                  </motion.span>
                </div>
                <div className="block text-6xl md:text-8xl lg:text-9xl font-black text-white mt-4">
                  Your Coding Journey
                </div>
              </h1>
              
              {/* Enhanced Subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
                className="text-xl md:text-2xl lg:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
              >
                Transform your programming skills with 
                <span className="font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> AI-powered</span> 
                {' '}learning and real-world challenges.
              </motion.p>
            </div>

            {/* Stunning CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-blue-600/50 overflow-hidden"
              >
                <span className="relative z-10">Start Coding</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-12 py-6 bg-white/10 backdrop-blur-xl text-white font-bold text-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden"
              >
                <span className="relative z-10">Explore Problems</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.button>
            </motion.div>

            {/* Interactive Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 1 }}
              className="flex justify-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>10K+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>500+ Problems</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-sm font-light tracking-widest">SCROLL TO EXPLORE</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-8 bg-gradient-to-b from-transparent to-gray-400 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-8 mb-20"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">CodeForge</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to become a coding champion
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="relative p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                  
                  <div className={`text-4xl md:text-5xl mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                    {feature.description}
                  </p>
                  
                  {/* Hover indicator */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StunningHero;

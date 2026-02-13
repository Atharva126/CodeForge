import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import UltraSimpleMagneticBackground from '../components/UltraSimpleMagneticBackground';
import HackerTerminal from './HackerTerminal';

const MinimalHero: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen text-gray-900 dark:text-white relative bg-[#f8fbff] dark:bg-transparent"
      style={{
        background: resolvedTheme === 'light'
          ? 'linear-gradient(to bottom, #f8fbff 0%, #edf4ff 50%, #e1ebff 100%)'
          : 'linear-gradient(to bottom, #0a0f1f 0%, #0b1224 50%, #0c1428 100%)'
      }}>
      <UltraSimpleMagneticBackground />
      <div className="fixed top-[100vh] left-0 right-0 bottom-0" style={{ backdropFilter: 'blur(1px)', zIndex: 1 }}></div>

      <section className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0" style={{ background: resolvedTheme === 'dark' ? 'rgba(5, 10, 20, 0.15)' : 'rgba(255, 255, 255, 0.05)', zIndex: 1 }}></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center space-y-16">
            {/* Main headline */}
            <div className="space-y-8">
              <h1 className="leading-tight">
                <motion.div
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="block text-7xl md:text-8xl font-bold text-gray-900 dark:text-white"
                >
                  Code.
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="block text-7xl md:text-8xl font-bold text-gray-900 dark:text-white"
                >
                  Conquer.
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="block text-7xl md:text-8xl font-bold text-gray-900 dark:text-white"
                >
                  Forge.
                </motion.div>
              </h1>

              {/* Subtitle */}
              <p
                className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Master data structures, algorithms, and competitive programming with AI-powered assistance and real-time contests.
              </p>
            </div>

            {/* CTA buttons */}
            <div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <button
                onClick={() => navigate('/problems')}
                className="px-12 py-6 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/50 hover:shadow-blue-600/40 transition-all duration-300 cursor-pointer"
              >
                Start Coding
              </button>

              <button
                onClick={() => navigate('/problems')}
                className="px-12 py-6 bg-white dark:bg-white text-gray-900 dark:text-black font-bold text-lg rounded-xl border border-gray-200 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                Explore Problems
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-gray-900" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose CodeForge
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Everything you need to master coding, from beginner to expert level.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "AI-Powered Learning",
                description: "Get personalized guidance and instant feedback on your code with our advanced AI assistant.",
                color: ""
              },
              {
                icon: "⚡",
                title: "Real-time Contests",
                description: "Compete with developers worldwide in live coding challenges and climb the leaderboards.",
                color: ""
              },
              {
                icon: "📚",
                title: "Comprehensive Library",
                description: "Access thousands of problems across all difficulty levels and programming languages.",
                color: ""
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800/40 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl dark:shadow-2xl"
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-blue-50 dark:bg-gray-600 flex items-center justify-center text-3xl mb-6 mx-auto`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-black to-transparent"></div>
      </section>

      {/* Hacker Challenge Section - Relocated */}
      <section className="py-24 bg-gray-900/50 dark:bg-black/50 relative overflow-hidden" style={{ zIndex: 10 }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,100,0.05),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Test Your <span className="text-green-500">Skills</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Beat the system to prove your worth. Only the elite gain full access to the Forge.
            </p>
          </div>
          <div className="relative">
            <HackerTerminal />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20" style={{ zIndex: 10 }}>
        <div className="absolute inset-0" style={{ background: resolvedTheme === 'dark' ? 'rgba(5, 10, 20, 0.50)' : 'rgba(237, 244, 255, 0.40)', zIndex: 1 }}></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Active Coders", color: "text-blue-400" },
              { number: "50K+", label: "Problems Solved", color: "text-green-400" },
              { number: "500+", label: "Daily Contests", color: "text-purple-400" },
              { number: "95%", label: "Success Rate", color: "text-yellow-400" }
            ].map((stat, index) => (
              <div
                key={index}
                className="space-y-2"
              >
                <div
                  className={`text-4xl md:text-5xl font-bold ${stat.color}`}
                >
                  {stat.number}
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-100 dark:from-black to-transparent" style={{ filter: 'blur(4px)' }}></div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-gray-900" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Start your coding journey in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Choose Your Path",
                description: "Select from DSA, competitive programming, or interview preparation tracks.",
                icon: "🎯"
              },
              {
                step: "02",
                title: "Solve & Learn",
                description: "Tackle problems with AI guidance and instant feedback on your solutions.",
                icon: "💡"
              },
              {
                step: "03",
                title: "Compete & Grow",
                description: "Join contests, climb rankings, and showcase your skills to the community.",
                icon: "🏆"
              }
            ].map((step, index) => (
              <div
                key={index}
                className="text-center space-y-6 bg-white dark:bg-gray-800/40 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl dark:shadow-2xl"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-100 dark:from-black to-transparent" style={{ filter: 'blur(4px)' }}></div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24" style={{ zIndex: 10 }}>
        <div className="absolute inset-0" style={{ background: resolvedTheme === 'dark' ? 'rgba(5, 10, 20, 0.50)' : 'rgba(237, 244, 255, 0.30)', zIndex: 1 }}></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              What Our <span className="text-blue-600 dark:text-blue-400">Community</span> Says
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Join thousands of developers who have transformed their careers with CodeForge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Chen",
                role: "Software Engineer at Google",
                content: "CodeForge helped me land my dream job. The AI feedback is incredible!",
                avatar: "SC"
              },
              {
                name: "Marcus Rodriguez",
                role: "Full Stack Developer",
                content: "The contest system keeps me motivated. I've solved over 500 problems here.",
                avatar: "MR"
              },
              {
                name: "Priya Patel",
                role: "Senior Developer",
                content: "Best platform for interview prep. The explanations are crystal clear.",
                avatar: "PP"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-black to-transparent"></div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-gray-900" style={{ zIndex: 10 }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Ready to Start Your Coding Journey?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join the CodeForge community today and take your programming skills to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate('/problems')}
                className="px-12 py-6 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/50 hover:shadow-blue-600/40 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                Get Started Free
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="px-12 py-6 bg-white dark:bg-white text-gray-900 dark:text-black font-bold text-lg rounded-xl border border-gray-200 dark:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white dark:from-black to-transparent" style={{ filter: 'blur(4px)' }}></div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[#f8fbff] dark:bg-transparent" style={{ zIndex: 10 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: resolvedTheme === 'dark' ? 'rgba(5, 10, 20, 0.50)' : 'rgba(237, 244, 255, 0.20)', zIndex: -1 }}></div>
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4">CodeForge</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Empowering developers worldwide with AI-powered coding education and competitive programming tools.
              </p>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Problems</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Contests</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Interview Prep</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Explore</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Discuss</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Leaderboard</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © 2024 CodeForge. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default MinimalHero;

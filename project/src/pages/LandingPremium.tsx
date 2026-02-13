import { motion } from 'framer-motion';
import PremiumBackground from '../components/PremiumBackground';
import PremiumButtonNew from '../components/PremiumButtonNew';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-hidden">
      <PremiumBackground />
      
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center space-y-16"
          >
            {/* Premium badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10"
            >
              <span className="text-yellow-400 text-sm">⚡</span>
              <span className="text-sm font-medium text-gray-300">
                AI-Powered Competitive Coding Platform
              </span>
            </motion.div>
            
            {/* Dominant headline */}
            <div className="space-y-8">
              <h1 className="leading-tight tracking-tight">
                <div className="block text-7xl md:text-8xl font-bold">
                  <span 
                    className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
                    style={{
                      backgroundSize: '200% 200%',
                      animation: 'gradient-shift 8s ease-in-out infinite'
                    }}
                  >
                    Forge your coding skills.
                  </span>
                </div>
                <div className="block text-7xl md:text-8xl font-bold text-white mt-4">
                  One problem at a time.
                </div>
              </h1>
              
              {/* Refined subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Master data structures, algorithms, and competitive programming with 
                <span className="text-blue-400 font-medium"> AI-powered assistance</span> 
                {' '}and real-time contests.
              </motion.p>
            </div>
            
            {/* Premium CTA buttons */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <PremiumButtonNew
                as="a"
                href="/problems"
                variant="primary"
                className="text-lg"
              >
                Start Coding
              </PremiumButtonNew>
              
              <PremiumButtonNew
                as="a"
                href="/contests"
                variant="secondary"
                className="text-lg"
              >
                Explore Problems
              </PremiumButtonNew>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Subtle scroll indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 2, delay: 1 }}
            className="text-gray-500 text-sm font-light tracking-widest"
          >
            SCROLL TO EXPLORE
          </motion.div>
        </div>
      </section>

      {/* Content sections below hero */}
      <section className="relative py-32 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Why Choose CodeForge?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Everything you need to master competitive programming
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mt-24">
            {[
              {
                icon: '⚡',
                title: 'Lightning Fast',
                description: 'Execute code instantly with our optimized runtime environment'
              },
              {
                icon: '🎯',
                title: 'Precise Feedback',
                description: 'Get detailed insights on your code performance and errors'
              },
              {
                icon: '🏆',
                title: 'Compete & Win',
                description: 'Join contests and climb the global leaderboard'
              },
              {
                icon: '🤖',
                title: 'AI Assistant',
                description: 'Get intelligent hints and code optimization suggestions'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center space-y-4 group"
              >
                <div className="text-4xl mb-4 transform transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

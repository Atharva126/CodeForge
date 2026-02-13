// Interactive Code Demo with XP Rewards
// Shows compilation, test cases, and achievement animations

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap } from 'lucide-react';

interface CodeDemoProps {
  isVisible: boolean;
}

const InteractiveCodeDemo: React.FC<CodeDemoProps> = ({ isVisible }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showXP, setShowXP] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const codeSteps = [
    'const twoSum = (nums, target) => {',
    '  const map = new Map();',
    '  for (let i = 0; i < nums.length; i++) {',
    '    const complement = target - nums[i];',
    '    if (map.has(complement)) {',
    '      return [map.get(complement), i];',
    '    }',
    '    map.set(nums[i], i);',
    '  }',
    '  return [];',
    '};'
  ];

  const testCases = [
    { input: '[2,7,11,15], 9', expected: '[0,1]', status: 'pending' },
    { input: '[3,2,4], 6', expected: '[1,2]', status: 'pending' },
    { input: '[3,3], 6', expected: '[0,1]', status: 'pending' }
  ];

  useEffect(() => {
    if (isVisible && currentStep === 0) {
      const typeInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < codeSteps.length) {
            return prev + 1;
          }
          clearInterval(typeInterval);
          return prev;
        });
      }, 100);

      return () => clearInterval(typeInterval);
    }
  }, [isVisible]);

  const runCode = async () => {
    setIsCompiling(true);
    setOutput('');
    
    // Compilation animation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOutput(' Compiling code...\n');
    setIsCompiling(false);
    setIsRunning(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    setOutput(prev => prev + ' Compilation successful!\n\n');
    
    // Running test cases
    await new Promise(resolve => setTimeout(resolve, 600));
    setOutput(prev => prev + ' Running test cases...\n\n');
    
    await new Promise(resolve => setTimeout(resolve, 400));
    setOutput(prev => prev + ' Test 1: [2,7,11,15], 9\n');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setOutput(prev => prev + ' Expected: [0,1]\n');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setOutput(prev => prev + ' Output: [0,1]\n');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setOutput(prev => prev + ' Passed\n\n');
    
    await new Promise(resolve => setTimeout(resolve, 400));
    setOutput(prev => prev + ' Test 2: [3,2,4], 6\n');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setOutput(prev => prev + ' Expected: [1,2]\n');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setOutput(prev => prev + ' Output: [1,2]\n');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setOutput(prev => prev + ' Passed\n\n');
    
    await new Promise(resolve => setTimeout(resolve, 400));
    setOutput(prev => prev + ' Test 3: [3,3], 6\n');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    setOutput(prev => prev + ' Expected: [0,1]\n');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setOutput(prev => prev + ' Output: [0,1]\n');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    setOutput(prev => prev + ' Passed\n\n');

    await new Promise(resolve => setTimeout(resolve, 800));
    setOutput(prev => prev + ' All test cases passed!\n\n Accepted \n\n +50 XP Earned!');
    setIsRunning(false);

    // Show XP reward
    setXpEarned(50);
    setShowXP(true);

    setTimeout(() => {
      setShowXP(false);
    }, 3000);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setOutput('');
    setIsCompiling(false);
    setIsRunning(false);
    setShowXP(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="absolute top-8 right-8 w-96 bg-black/90 backdrop-blur-xl rounded-lg border border-cyan-500/30 p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
          </div>
          <span className="text-cyan-400 text-xs font-mono">solution.js</span>
        </div>

        {/* XP Badge */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
        >
          <Zap className="w-3 h-3" />
          <span>Level 3</span>
        </motion.div>
      </motion.div>

      <div className="bg-gray-900 rounded p-3 mb-3 font-mono text-xs text-green-400 h-48 overflow-hidden relative">
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          {currentStep}/{codeSteps.length}
        </div>
        <pre className="whitespace-pre-wrap">
          {codeSteps.slice(0, currentStep).join('\n')}
          <span className="animate-pulse text-cyan-400">|</span>
        </pre>
      </div>

      <div className="flex gap-2 mb-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={runCode}
          disabled={isCompiling || isRunning || currentStep < codeSteps.length}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-3 py-2 rounded font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50 transition-all"
        >
          {isCompiling ? '🔧 Compiling...' : isRunning ? '🧪 Running...' : '▶ Run Code'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetDemo}
          className="bg-gray-700 text-gray-300 px-3 py-2 rounded font-semibold text-sm hover:bg-gray-600 transition-all"
        >
          Reset
        </motion.button>
      </div>

      {output && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 rounded p-3 font-mono text-xs h-32 overflow-y-auto border border-green-500/30"
        >
          <div className="text-green-400 whitespace-pre-wrap">{output}</div>
        </motion.div>
      )}

      {/* XP Reward Animation */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 1.5 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-6 rounded-2xl shadow-2xl border-2 border-yellow-300">
              <div className="flex items-center gap-3">
                <Trophy className="w-12 h-12 text-yellow-300" />
                <div>
                  <div className="text-2xl font-bold">+{xpEarned} XP</div>
                  <div className="text-sm">Problem Solved!</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-center">🔓 Achievement Unlocked: Speed Coder</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveCodeDemo;

// Unlock System Component
// Shows data structures unlocking with animation

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Database, GitBranch, Network } from 'lucide-react';

interface UnlockItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  locked: boolean;
  progress: number;
  color: string;
}

const UnlockSystem: React.FC = () => {
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [showUnlock, setShowUnlock] = useState<string | null>(null);

  const unlockItems: UnlockItem[] = [
    {
      id: 'arrays',
      name: 'Arrays',
      icon: <Database className="w-6 h-6" />,
      locked: false,
      progress: 100,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'trees',
      name: 'Trees',
      icon: <GitBranch className="w-6 h-6" />,
      locked: false,
      progress: 100,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'graphs',
      name: 'Graphs',
      icon: <Network className="w-6 h-6" />,
      locked: true,
      progress: 65,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'dp',
      name: 'Dynamic Programming',
      icon: <Lock className="w-6 h-6" />,
      locked: true,
      progress: 30,
      color: 'from-orange-500 to-red-500'
    }
  ];

  useEffect(() => {
    // Simulate unlocking sequence
    const unlockSequence = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUnlockedItems(['arrays']);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setUnlockedItems(prev => [...prev, 'trees']);
      
      // Show unlock animation for graphs
      await new Promise(resolve => setTimeout(resolve, 1200));
      setShowUnlock('graphs');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowUnlock(null);
    };

    unlockSequence();
  }, []);

  return (
    <div className="fixed top-8 left-8 z-20">
      <div className="bg-black/80 backdrop-blur-xl rounded-lg border border-gray-700/30 p-4">
        <div className="text-xs text-gray-400 mb-3 font-mono">SYSTEM UNLOCKS</div>
        
        <div className="space-y-3">
          {unlockItems.map((item, index) => {
            const isUnlocked = unlockedItems.includes(item.id);
            const isUnlocking = showUnlock === item.id;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: isUnlocked ? 1 : 0.5, 
                  x: 0,
                  scale: isUnlocking ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.2,
                  scale: isUnlocking ? { repeat: 2, duration: 0.3 } : undefined
                }}
                className={`relative p-3 rounded-lg border transition-all ${
                  isUnlocked 
                    ? 'bg-gradient-to-r ' + item.color + ' text-white border-transparent' 
                    : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    isUnlocked 
                      ? 'bg-white/20' 
                      : 'bg-gray-700'
                  }`}>
                    {isUnlocked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${
                      isUnlocked ? 'text-white' : 'text-gray-400'
                    }`}>
                      {item.name}
                    </div>
                    
                    {!isUnlocked && (
                      <div className="text-xs text-gray-500 mt-1">
                        Progress: {item.progress}%
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Unlock animation overlay */}
                <AnimatePresence>
                  {isUnlocking && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg"
                    >
                      <div className="text-center">
                        <Unlock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <div className="text-green-400 font-bold text-sm">UNLOCKED!</div>
                        <div className="text-xs text-gray-400 mt-1">{item.name} Mastered</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-700/30">
          <div className="text-xs text-gray-400 font-mono mb-2">LEVELING UP</div>
          <div className="text-xs text-gray-500">
            You are mastering data structures...
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockSystem;

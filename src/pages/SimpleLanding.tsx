// Simple Working Landing Page
// No complex background components to isolate the issue

import React from 'react';

const SimpleLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-6xl font-bold text-white">CodeForge</h1>
        <p className="text-xl text-gray-300">Simple landing page to test background</p>
      </div>
    </div>
  );
};

export default SimpleLanding;

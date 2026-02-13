// Premium Gradient Text Component
// Clean, animated gradient with subtle sweep effect

import React from 'react';

interface PremiumGradientTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

const PremiumGradientText: React.FC<PremiumGradientTextProps> = ({ 
  children, 
  className = '',
  size = '4xl'
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
    '7xl': 'text-7xl'
  };

  return (
    <span 
      className={`
        ${sizeClasses[size]} 
        font-bold 
        leading-tight
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #475569 50%, #64748b 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        textFillColor: 'transparent',
        backgroundSize: '200% 200%',
        animation: 'gradient-sweep 8s ease-in-out infinite'
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient-sweep {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </span>
  );
};

export default PremiumGradientText;

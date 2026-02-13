// Futuristic Animated Text Component
// Glitch effects, gradient animations, and coding aesthetics

import React from 'react';

interface FuturisticTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  glitch?: boolean;
  gradient?: boolean;
}

const FuturisticText: React.FC<FuturisticTextProps> = ({ 
  children, 
  className = '',
  size = '4xl',
  glitch = false,
  gradient = true
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

  const baseClasses = `
    ${sizeClasses[size]} 
    font-bold 
    leading-tight
    tracking-tight
    ${className}
  `;

  if (glitch) {
    return (
      <span 
        className={`${baseClasses} relative inline-block`}
        style={{
          animation: 'glitch 2s infinite',
          textShadow: '0 0 10px rgba(96, 165, 250, 0.5)'
        }}
      >
        {children}
        <span 
          className="absolute inset-0 text-cyan-400 opacity-50"
          style={{
            animation: 'glitch-2 2s infinite',
            transform: 'translate(-2px, 2px)'
          }}
        >
          {children}
        </span>
        <span 
          className="absolute inset-0 text-purple-400 opacity-30"
          style={{
            animation: 'glitch-3 2s infinite',
            transform: 'translate(2px, -2px)'
          }}
        >
          {children}
        </span>
        <style jsx>{`
          @keyframes glitch {
            0%, 100% { text-shadow: 0 0 10px rgba(96, 165, 250, 0.5); }
            25% { text-shadow: -2px 0 10px rgba(167, 139, 250, 0.5); }
            50% { text-shadow: 2px 0 10px rgba(52, 211, 153, 0.5); }
            75% { text-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
          }
          @keyframes glitch-2 {
            0%, 100% { clip-path: inset(0 0 0 0); }
            25% { clip-path: inset(0 0 100% 0); }
            50% { clip-path: inset(0 0 0 100%); }
            75% { clip-path: inset(100% 0 0 0); }
          }
          @keyframes glitch-3 {
            0%, 100% { clip-path: inset(0 0 0 0); }
            25% { clip-path: inset(0 100% 0 0); }
            50% { clip-path: inset(0 0 0 100%); }
            75% { clip-path: inset(0 0 100% 0); }
          }
        `}</style>
      </span>
    );
  }

  if (gradient) {
    return (
      <span 
        className={baseClasses}
        style={{
          background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 25%, #34D399 50%, #F59E0B 75%, #EF4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          backgroundSize: '200% 200%',
          animation: 'gradient-shift 8s ease-in-out infinite',
          filter: 'drop-shadow(0 0 20px rgba(96, 165, 250, 0.3))'
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <span className={baseClasses}>
      {children}
    </span>
  );
};

export default FuturisticText;

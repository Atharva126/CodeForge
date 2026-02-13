// Interactive Futuristic Button
// Neon glow, magnetic hover, and coding aesthetics

import React, { useState, useRef, useEffect } from 'react';

interface InteractiveButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a';
  variant?: 'primary' | 'secondary' | 'neon';
}

const InteractiveButton: React.FC<InteractiveButtonProps> = ({ 
  children, 
  className = '', 
  onClick, 
  href,
  as = 'button',
  variant = 'primary'
}) => {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current || !isHovered) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 150;
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = deltaX * force * 0.2;
        const moveY = deltaY * force * 0.2;
        
        setPosition({ x: moveX, y: moveY });
      } else {
        setPosition({ x: 0, y: 0 });
      }
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      // Create particle effect
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 20 - 10,
        y: Math.random() * 20 - 10
      }));
      setParticles(newParticles);
      
      setTimeout(() => setParticles([]), 1000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered]);

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-black text-white border-2 border-cyan-500 shadow-lg shadow-cyan-500/25';
      case 'secondary':
        return 'bg-white text-black border-2 border-gray-300 shadow-lg shadow-gray-300/25';
      case 'neon':
        return 'bg-transparent text-cyan-400 border-2 border-cyan-400 shadow-lg shadow-cyan-400/50';
      default:
        return 'bg-black text-white border-2 border-cyan-500';
    }
  };

  const baseClasses = "relative inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold transition-all duration-300 ease-out transform overflow-hidden";
  const combinedClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  const Component = as === 'a' ? 'a' : 'button';
  const componentProps = as === 'a' 
    ? { href, style, className: combinedClasses }
    : { onClick, style, className: combinedClasses };

  return (
    <Component 
      ref={buttonRef as any}
      {...componentProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Animated border glow */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: isHovered 
            ? 'linear-gradient(45deg, transparent, rgba(96, 165, 250, 0.1), transparent)'
            : 'none',
          animation: isHovered ? 'border-glow 2s ease-in-out infinite' : 'none'
        }}
      />
      
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            animation: 'particle-float 1s ease-out forwards'
          }}
        />
      ))}
      
      {/* Scanning line effect */}
      {isHovered && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            style={{
              animation: 'scan-line 2s linear infinite'
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes border-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.5), inset 0 0 20px rgba(96, 165, 250, 0.1); }
          50% { box-shadow: 0 0 30px rgba(167, 139, 250, 0.7), inset 0 0 30px rgba(167, 139, 250, 0.2); }
        }
        @keyframes scan-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes particle-float {
          0% { 
            opacity: 1; 
            transform: translate(0, 0) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translate(var(--tx, 20px), var(--ty, -20px)) scale(0); 
          }
        }
      `}</style>
    </Component>
  );
};

export default InteractiveButton;

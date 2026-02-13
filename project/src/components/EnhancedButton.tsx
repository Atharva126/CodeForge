// Enhanced Premium Button
// More visual interest while maintaining luxury feel

import React, { useState, useRef, useEffect } from 'react';

interface EnhancedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a';
  variant?: 'primary' | 'secondary' | 'glow';
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({ 
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

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Create particle burst
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 40 - 20,
      y: Math.random() * 40 - 20
    }));
    setParticles(newParticles);
    
    setTimeout(() => setParticles([]), 1000);
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current || !isHovered) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 120;
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = deltaX * force * 0.2;
        const moveY = deltaY * force * 0.2;
        
        setPosition({ x: moveX, y: moveY });
      } else {
        setPosition({ x: 0, y: 0 });
      }
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
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 border border-blue-500/20';
      case 'secondary':
        return 'bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/30';
      case 'glow':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 border border-purple-500/20';
      default:
        return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30';
    }
  };

  const baseClasses = "relative inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ease-out transform overflow-hidden";
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Animated gradient overlay */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          background: isHovered 
            ? 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)'
            : 'none',
          animation: isHovered ? 'shimmer 2s infinite' : 'none'
        }}
      />
      
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-400 rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(${particle.x}px, ${particle.y}px)`,
            animation: 'particle-burst 1s ease-out forwards'
          }}
        />
      ))}
      
      {/* Scanning line effect */}
      {isHovered && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{
              animation: 'scan-line 2s linear infinite'
            }}
          />
        </div>
      )}
    </Component>
  );
};

export default EnhancedButton;

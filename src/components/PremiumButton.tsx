// Premium Magnetic Button Component
// Clean, elegant, and refined hover effects

import React, { useState, useRef, useEffect } from 'react';

interface PremiumButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a';
  variant?: 'primary' | 'secondary';
}

const PremiumButton: React.FC<PremiumButtonProps> = ({ 
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current || !isHovered) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 100;
      
      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        const moveX = deltaX * force * 0.15;
        const moveY = deltaY * force * 0.15;
        
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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isHovered]);

  const baseClasses = "relative inline-flex items-center justify-center px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 ease-out transform";
  
  const variantClasses = variant === 'primary' 
    ? "bg-black text-white border border-gray-800 hover:border-gray-700"
    : "bg-white text-black border border-gray-200 hover:border-gray-300";
  
  const combinedClasses = `${baseClasses} ${variantClasses} ${className}`;

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
      
      {/* Subtle inner shadow for depth */}
      <div 
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
        style={{
          background: isHovered 
            ? 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 70%)'
            : 'none',
          boxShadow: isHovered 
            ? 'inset 0 2px 4px rgba(0,0,0,0.1)'
            : 'none'
        }}
      />
      
      {/* Very subtle border glow */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: isHovered 
            ? '0 0 20px rgba(0,0,0,0.1)'
            : 'none',
          border: isHovered 
            ? '1px solid rgba(255,255,255,0.1)'
            : 'none'
        }}
      />
    </Component>
  );
};

export default PremiumButton;

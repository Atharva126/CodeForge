// Magnetic Button Component with Hover Effects
import React, { useState, useRef, useEffect } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a';
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  children, 
  className = '', 
  onClick, 
  href,
  as = 'button'
}) => {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 100;
      
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
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const baseClasses = "relative inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 ease-out transform hover:scale-105";
  const combinedClasses = `${baseClasses} ${className}`;

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
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 rounded-lg border border-white/10 hover:border-white/20 transition-colors duration-300" />
    </Component>
  );
};

export default MagneticButton;

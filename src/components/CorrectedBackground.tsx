// Corrected Magnetic Background
// Elements move smoothly toward cursor when close, proper magnetic behavior

import React, { useEffect, useRef, useState } from 'react';

interface CodeElement {
  id: number;
  x: number;
  y: number;
  content: string;
  color: string;
  size: number;
}

const CorrectedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const codeElements = [
    { content: 'const', color: '#60A5FA' },
    { content: 'function', color: '#8B5CF6' },
    { content: 'async', color: '#10B981' },
    { content: 'await', color: '#F59E0B' },
    { content: 'return', color: '#EF4444' },
    { content: 'import', color: '#06B6D4' },
    { content: 'export', color: '#14B8A6' },
    { content: 'class', color: '#3B82F6' },
    { content: 'map', color: '#8B5CF6' },
    { content: 'filter', color: '#10B981' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initialize static elements
    const elements: CodeElement[] = Array.from({ length: 4 }, (_, i) => {
      const elementData = codeElements[i % codeElements.length];
      return {
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        content: elementData.content,
        color: elementData.color,
        size: Math.random() * 15 + 25
      };
    });

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.01;

      // Glass black background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#334155');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse magnetic effect
      const mouseGradient = ctx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        0,
        mousePosition.x,
        mousePosition.y,
        200
      );
      
      mouseGradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
      mouseGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)');
      mouseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw elements with proper magnetic behavior
      elements.forEach((element, index) => {
        // Calculate distance from cursor
        const dx = mousePosition.x - element.x;
        const dy = mousePosition.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Magnetic attraction - move toward cursor when close
        if (distance < 100) {
          const force = (100 - distance) / 100;
          const attractionStrength = force * 0.03;
          
          // Move toward cursor
          element.x += dx * attractionStrength;
          element.y += dy * attractionStrength;
        }

        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);
        
        // Glow effect
        ctx.shadowColor = element.color;
        ctx.shadowBlur = distance < 100 ? 15 : 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw text
        ctx.fillStyle = element.color;
        ctx.font = `${element.size}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Pulse effect when cursor is close
        const pulse = distance < 100 ? Math.sin(time * 2 + index) * 0.1 + 1 : 1;
        ctx.globalAlpha = 0.8 * pulse;
        
        ctx.fillText(element.content, 0, 0);
        
        ctx.restore();
      });

      // Connect nearby elements
      elements.forEach((element, index) => {
        elements.slice(index + 1).forEach(otherElement => {
          const dx = otherElement.x - element.x;
          const dy = otherElement.y - element.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 * (1 - distance / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mousePosition]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 pointer-events-none" />
    </div>
  );
};

export default CorrectedBackground;

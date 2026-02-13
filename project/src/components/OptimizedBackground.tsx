// Optimized Coding Background
// Minimal coding elements with smooth magnetic effects

import React, { useEffect, useRef, useState } from 'react';

interface CodeElement {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  content: string;
  color: string;
}

const OptimizedBackground: React.FC = () => {
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

    // Initialize coding elements
    const elements: CodeElement[] = Array.from({ length: 4 }, (_, i) => {
      const elementData = codeElements[i % codeElements.length];
      return {
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0, // Start with no velocity
        vy: 0, // Start with no velocity
        size: Math.random() * 15 + 20, // Smaller size
        content: elementData.content,
        color: elementData.color
      };
    });

    // Smooth animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.005; // Slower animation speed

      // Glass black background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#334155');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle mouse magnetic effect
      const mouseGradient = ctx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        0,
        mousePosition.x,
        mousePosition.y,
        250 // Smaller radius
      );
      
      mouseGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)'); // Reduced opacity
      mouseGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.025)'); // Reduced opacity
      mouseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw coding elements
      elements.forEach((element, index) => {
        // Calculate distance from cursor
        const dx = mousePosition.x - element.x;
        const dy = mousePosition.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // ONLY move when cursor is very close (within 40px)
        if (distance < 40) {
          const force = (40 - distance) / 40;
          element.vx = (dx / distance) * force * 0.1;
          element.vy = (dy / distance) * force * 0.1;
        } else {
          // Stop completely when cursor is far
          element.vx *= 0.8;
          element.vy *= 0.8;
        }

        // Update position
        element.x += element.vx;
        element.y += element.vy;

        // Apply friction to stop movement
        element.vx *= 0.9;
        element.vy *= 0.9;

        // Wrap around edges
        if (element.x < -50) element.x = canvas.width + 50;
        if (element.x > canvas.width + 50) element.x = -50;
        if (element.y < -50) element.y = canvas.height + 50;
        if (element.y > canvas.height + 50) element.y = -50;

        // Draw element with subtle glow
        ctx.save();
        ctx.translate(element.x, element.y);
        
        // Reduced glow effect
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw text
        ctx.fillStyle = element.color;
        ctx.font = `${element.size}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Only pulse when cursor is very close
        const pulse = distance < 40 ? Math.sin(time * 2 + index) * 0.05 + 1 : 1;
        ctx.globalAlpha = 0.7 * pulse;
        
        ctx.fillText(element.content, 0, 0);
        
        ctx.restore();
      });

      // Connect nearby elements only when cursor is near
      elements.forEach((element, index) => {
        elements.slice(index + 1).forEach(otherElement => {
          const dx = otherElement.x - element.x;
          const dy = otherElement.y - element.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Only show connections when elements are close to each other
          if (distance < 100) { // Smaller connection radius
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - distance / 100)})`; // Reduced opacity
            ctx.lineWidth = 0.5;
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

export default OptimizedBackground;

// Simple Working Magnetic Background
// Elements move toward cursor smoothly when close

import React, { useEffect, useRef, useState } from 'react';

interface CodeElement {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  content: string;
  color: string;
  size: number;
}

const SimpleMagneticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const codeElements = [
    { content: 'const', color: '#60A5FA', vx: 0, vy: 0 },
    { content: 'function', color: '#8B5CF6', vx: 0, vy: 0 },
    { content: 'async', color: '#10B981', vx: 0, vy: 0 },
    { content: 'await', color: '#F59E0B', vx: 0, vy: 0 }
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

    // Initialize elements with zero velocity
    const elements: CodeElement[] = Array.from({ length: 4 }, (_, i) => {
      const elementData = codeElements[i % codeElements.length];
      return {
        id: i,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        content: elementData.content,
        color: elementData.color,
        size: Math.random() * 15 + 25
      };
    });

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.02;

      // Clear canvas
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse gradient
      const mouseGradient = ctx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        0,
        mousePosition.x,
        mousePosition.y,
        150
      );
      
      mouseGradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      mouseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw elements
      elements.forEach((element, index) => {
        // Store old position for consistent distance calculation
        const oldX = element.x;
        const oldY = element.y;
        
        // Calculate distance from cursor
        const dx = mousePosition.x - oldX;
        const dy = mousePosition.y - oldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Simple magnetic - move toward cursor when close
        if (distance < 100) {
          const moveX = dx * 0.03;
          const moveY = dy * 0.03;
          element.x += moveX;
          element.y += moveY;
        }

        // Update position
        element.x += element.vx;
        element.y += element.vy;

        // Wrap around edges
        if (element.x < -50) element.x = canvas.width + 50;
        if (element.x > canvas.width + 50) element.x = -50;
        if (element.y < -50) element.y = canvas.height + 50;
        if (element.y > canvas.height + 50) element.y = -50;

        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);
        
        // Glow
        ctx.shadowColor = element.color;
        ctx.shadowBlur = distance < 80 ? 10 : 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Text
        ctx.fillStyle = element.color;
        ctx.font = `${element.size}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Pulse
        const pulse = distance < 80 ? Math.sin(time * 2 + index) * 0.1 + 1 : 1;
        ctx.globalAlpha = 0.8 * pulse;
        
        ctx.fillText(element.content, 0, 0);
        
        ctx.restore();
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
    </div>
  );
};

export default SimpleMagneticBackground;

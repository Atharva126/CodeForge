// Minimalist Premium Background
// Subtle animated gradient mesh with clean aesthetics

import React, { useEffect, useRef } from 'react';

const MinimalistBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

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

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.001;

      // Clear canvas with dark background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create subtle gradient mesh
      const gradient1 = ctx.createRadialGradient(
        canvas.width * (0.3 + mouseRef.current.x * 0.2),
        canvas.height * (0.3 + mouseRef.current.y * 0.2),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      );
      
      gradient1.addColorStop(0, 'rgba(99, 102, 241, 0.03)');
      gradient1.addColorStop(0.5, 'rgba(139, 92, 246, 0.02)');
      gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Second gradient layer
      const gradient2 = ctx.createRadialGradient(
        canvas.width * (0.7 + Math.sin(time) * 0.1),
        canvas.height * (0.7 + Math.cos(time) * 0.1),
        0,
        canvas.width * 0.4,
        canvas.height * 0.4,
        canvas.width * 0.6
      );
      
      gradient2.addColorStop(0, 'rgba(6, 182, 212, 0.02)');
      gradient2.addColorStop(0.5, 'rgba(59, 130, 246, 0.01)');
      gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Very subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 0.5;
      
      const gridSize = 50;
      const offsetX = (mouseRef.current.x * 20) % gridSize;
      const offsetY = (mouseRef.current.y * 20) % gridSize;
      
      // Vertical lines
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Subtle depth gradient */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%)'
        }} 
      />
    </div>
  );
};

export default MinimalistBackground;

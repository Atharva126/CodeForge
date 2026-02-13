// Ultra Simple Working Background
// Most basic magnetic effect that should work

import React, { useEffect, useRef, useState } from 'react';

const UltraSimpleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Simple elements
    const elements = [
      { x: 100, y: 100, text: 'const', color: '#60A5FA' },
      { x: 300, y: 200, text: 'function', color: '#8B5CF6' },
      { x: 500, y: 150, text: 'async', color: '#10B981' },
      { x: 200, y: 300, text: 'await', color: '#F59E0B' }
    ];

    let animationId: number;

    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse effect
      const gradient = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, 100);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw elements
      elements.forEach((element, index) => {
        const dx = mousePos.x - element.x;
        const dy = mousePos.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Simple magnetic
        if (distance < 100) {
          const moveX = dx * 0.02;
          const moveY = dy * 0.02;
          element.x += moveX;
          element.y += moveY;
        }

        // Draw
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.fillStyle = element.color;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = distance < 100 ? 1 : 0.5;
        ctx.fillText(element.text, 0, 0);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mousePos]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default UltraSimpleBackground;

// Interactive Coding Background
// Floating code elements, neural connections, and interactive depth

import React, { useEffect, useRef, useState } from 'react';

interface CodeElement {
  id: string;
  type: 'code' | 'symbol' | 'operator';
  content: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const InteractiveCodingBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const codeElements = [
    { type: 'code' as const, content: 'const', color: '#60A5FA' },
    { type: 'code' as const, content: 'function', color: '#A78BFA' },
    { type: 'code' as const, content: 'class', color: '#34D399' },
    { type: 'code' as const, content: 'async', color: '#F59E0B' },
    { type: 'code' as const, content: 'await', color: '#EF4444' },
    { type: 'code' as const, content: 'return', color: '#8B5CF6' },
    { type: 'code' as const, content: 'import', color: '#06B6D4' },
    { type: 'code' as const, content: 'export', color: '#10B981' },
    { type: 'symbol' as const, content: '{', color: '#60A5FA' },
    { type: 'symbol' as const, content: '}', color: '#60A5FA' },
    { type: 'symbol' as const, content: '(', color: '#A78BFA' },
    { type: 'symbol' as const, content: ')', color: '#A78BFA' },
    { type: 'symbol' as const, content: '[', color: '#34D399' },
    { type: 'symbol' as const, content: ']', color: '#34D399' },
    { type: 'symbol' as const, content: '<', color: '#F59E0B' },
    { type: 'symbol' as const, content: '>', color: '#F59E0B' },
    { type: 'operator' as const, content: '=>', color: '#EF4444' },
    { type: 'operator' as const, content: '===', color: '#8B5CF6' },
    { type: 'operator' as const, content: '&&', color: '#06B6D4' },
    { type: 'operator' as const, content: '||', color: '#10B981' },
    { type: 'code' as const, content: 'map', color: '#60A5FA' },
    { type: 'code' as const, content: 'filter', color: '#A78BFA' },
    { type: 'code' as const, content: 'reduce', color: '#34D399' },
    { type: 'code' as const, content: 'forEach', color: '#F59E0B' },
    { type: 'code' as const, content: 'Promise', color: '#EF4444' },
    { type: 'code' as const, content: 'resolve', color: '#8B5CF6' },
    { type: 'code' as const, content: 'reject', color: '#06B6D4' },
    { type: 'code' as const, content: 'try', color: '#10B981' },
    { type: 'code' as const, content: 'catch', color: '#60A5FA' },
    { type: 'code' as const, content: 'finally', color: '#A78BFA' }
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

    // Initialize floating elements
    const elements: CodeElement[] = [];
    const elementCount = Math.min(25, Math.floor((window.innerWidth * window.innerHeight) / 15000));

    for (let i = 0; i < elementCount; i++) {
      const elementData = codeElements[Math.floor(Math.random() * codeElements.length)];
      elements.push({
        id: `element-${i}`,
        type: elementData.type,
        content: elementData.content,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 16 + 12,
        opacity: Math.random() * 0.6 + 0.2,
        color: elementData.color
      });
    }

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.01;

      // Clear with dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw elements
      elements.forEach((element, index) => {
        // Mouse interaction
        const dx = mouseRef.current.x - element.x;
        const dy = mouseRef.current.y - element.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100;
          element.vx += (dx / distance) * force * 0.02;
          element.vy += (dy / distance) * force * 0.02;
        }

        // Update position
        element.x += element.vx;
        element.y += element.vy;

        // Apply friction
        element.vx *= 0.99;
        element.vy *= 0.99;

        // Wrap around edges
        if (element.x < -50) element.x = canvas.width + 50;
        if (element.x > canvas.width + 50) element.x = -50;
        if (element.y < -50) element.y = canvas.height + 50;
        if (element.y > canvas.height + 50) element.y = -50;

        // Draw connections between nearby elements
        elements.slice(index + 1).forEach(otherElement => {
          const dx = otherElement.x - element.x;
          const dy = otherElement.y - element.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120 && element.type === 'code' && otherElement.type === 'code') {
            ctx.strokeStyle = element.color + '20';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.stroke();
          }
        });

        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);
        
        // Add glow effect
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = element.color;
        ctx.font = `${element.size}px 'JetBrains Mono', 'Fira Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Pulsing effect for certain elements
        const pulse = Math.sin(time * 2 + index) * 0.1 + 1;
        ctx.globalAlpha = element.opacity * pulse;
        
        ctx.fillText(element.content, 0, 0);
        ctx.restore();
      });

      // Draw neural network overlay
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < 5; i++) {
        const centerX = canvas.width * (0.2 + i * 0.15);
        const centerY = canvas.height * 0.5;
        const radius = 50 + Math.sin(time + i) * 20;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Connect nodes
        if (i < 4) {
          const nextCenterX = canvas.width * (0.2 + (i + 1) * 0.15);
          const nextCenterY = canvas.height * 0.5;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(nextCenterX, nextCenterY);
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
    setIsLoaded(true);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)' }}
      />
      
      {/* Depth gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.2) 100%)'
        }} 
      />
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-cyan-400 font-mono text-sm animate-pulse">
            Initializing coding environment...
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCodingBackground;

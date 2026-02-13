// Lightweight Coding-Themed Background
// Floating brackets, arrays, and interactive elements

import React, { useEffect, useRef, useState } from 'react';

interface FloatingElement {
  id: string;
  type: 'bracket' | 'array' | 'node' | 'binary';
  x: number;
  y: number;
  vx: number;
  vy: number;
  content: string;
  color: string;
  size: number;
  rotation: number;
}

const CodingPlaygroundBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const elementsRef = useRef<FloatingElement[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const [isLoaded, setIsLoaded] = useState(false);

  // Coding elements to float
  const codingElements = [
    { type: 'bracket', content: '{', color: '#06b6d4' },
    { type: 'bracket', content: '}', color: '#06b6d4' },
    { type: 'bracket', content: '(', color: '#3b82f6' },
    { type: 'bracket', content: ')', color: '#3b82f6' },
    { type: 'bracket', content: '<', color: '#8b5cf6' },
    { type: 'bracket', content: '>', color: '#8b5cf6' },
    { type: 'bracket', content: '[', color: '#10b981' },
    { type: 'bracket', content: ']', color: '#10b981' },
    { type: 'array', content: '[1,2,3]', color: '#06b6d4' },
    { type: 'array', content: '["a","b"]', color: '#3b82f6' },
    { type: 'array', content: '[4,5,6,7]', color: '#8b5cf6' },
    { type: 'node', content: 'node', color: '#10b981' },
    { type: 'node', content: 'root', color: '#f59e0b' },
    { type: 'node', content: 'data', color: '#ef4444' },
    { type: 'binary', content: '01101', color: '#06b6d4' },
    { type: 'binary', content: '10110', color: '#3b82f6' },
    { type: 'binary', content: '11001', color: '#8b5cf6' },
    { type: 'array', content: '[]', color: '#6b7280' },
    { type: 'array', content: '{}', color: '#6b7280' },
    { type: 'node', content: 'null', color: '#9ca3af' },
    { type: 'node', content: 'true', color: '#10b981' },
    { type: 'node', content: 'false', color: '#ef4444' },
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
    const initElements = () => {
      const elements: FloatingElement[] = [];
      const elementCount = Math.min(25, Math.floor((window.innerWidth * window.innerHeight) / 20000));

      for (let i = 0; i < elementCount; i++) {
        const elementData = codingElements[Math.floor(Math.random() * codingElements.length)];
        elements.push({
          id: `element-${i}`,
          type: elementData.type as any,
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          content: elementData.content,
          color: elementData.color,
          size: Math.random() * 20 + 12,
          rotation: Math.random() * Math.PI * 2
        });
      }
      elementsRef.current = elements;
    };

    initElements();

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas with dark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw elements
      elementsRef.current.forEach((element) => {
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
        element.rotation += 0.01;

        // Apply friction
        element.vx *= 0.99;
        element.vy *= 0.99;

        // Wrap around edges
        if (element.x < -50) element.x = canvas.width + 50;
        if (element.x > canvas.width + 50) element.x = -50;
        if (element.y < -50) element.y = canvas.height + 50;
        if (element.y > canvas.height + 50) element.y = -50;

        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);
        
        // Add glow effect
        ctx.shadowColor = element.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = element.color;
        ctx.font = `${element.size}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw based on type
        if (element.type === 'bracket') {
          ctx.fillText(element.content, 0, 0);
        } else if (element.type === 'array') {
          // Draw array box
          ctx.strokeStyle = element.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(-element.content.length * 4, -10, element.content.length * 8, 20);
          ctx.fillText(element.content, 0, 0);
        } else if (element.type === 'node') {
          // Draw node circle
          ctx.beginPath();
          ctx.arc(0, 0, element.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = element.color + '20';
          ctx.fill();
          ctx.strokeStyle = element.color;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = element.color;
          ctx.font = `${element.size * 0.6}px 'Courier New', monospace`;
          ctx.fillText(element.content, 0, 0);
        } else if (element.type === 'binary') {
          // Draw binary with tech feel
          ctx.fillStyle = element.color + '80';
          ctx.fillRect(-element.content.length * 3, -8, element.content.length * 6, 16);
          ctx.fillStyle = element.color;
          ctx.fillText(element.content, 0, 0);
        }
        
        ctx.restore();
      });

      // Draw connections between nearby array elements
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.lineWidth = 1;
      
      const arrayElements = elementsRef.current.filter(e => e.type === 'array');
      arrayElements.forEach((elem1, i) => {
        arrayElements.slice(i + 1).forEach(elem2 => {
          const dx = elem1.x - elem2.x;
          const dy = elem1.y - elem2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.save();
            ctx.globalAlpha = (1 - distance / 150) * 0.3;
            ctx.beginPath();
            ctx.moveTo(elem1.x, elem1.y);
            ctx.lineTo(elem2.x, elem2.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();
    setIsLoaded(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)'
        }}
      />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid-bg" />
      </div>
      
      {/* Depth gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
        }} 
      />
      
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-green-400 font-mono text-sm animate-pulse">
            Initializing coding playground...
          </div>
        </div>
      )}
      
      <style jsx>{`
        .grid-bg {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  );
};

export default CodingPlaygroundBackground;

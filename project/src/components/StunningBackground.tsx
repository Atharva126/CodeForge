// Stunning Hero Background
// Combines glassmorphism, 3D elements, and interactive effects

import React, { useEffect, useRef, useState } from 'react';

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  rotation: number;
  type: 'cube' | 'sphere' | 'pyramid';
  color: string;
}

const StunningBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

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

    // Scroll tracking
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);

    // Floating 3D elements
    const elements: FloatingElement[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 100,
      size: Math.random() * 60 + 20,
      rotation: Math.random() * Math.PI * 2,
      type: ['cube', 'sphere', 'pyramid'][Math.floor(Math.random() * 3)] as 'cube' | 'sphere' | 'pyramid',
      color: ['#3B82F6', '#9333EA', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)]
    }));

    // Animation loop
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.01;

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#334155');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mouse interaction gradient
      const mouseGradient = ctx.createRadialGradient(
        mousePosition.x,
        mousePosition.y,
        0,
        mousePosition.x,
        mousePosition.y,
        400
      );
      
      mouseGradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      mouseGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.05)');
      mouseGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = mouseGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floating 3D elements
      elements.forEach((element, index) => {
        // Update position with parallax
        const parallaxX = (mousePosition.x - canvas.width / 2) * (element.z / 1000);
        const parallaxY = (mousePosition.y - canvas.height / 2) * (element.z / 1000);
        
        element.x += Math.sin(time + index) * 0.5;
        element.y += Math.cos(time + index) * 0.3;
        element.rotation += 0.01;

        // Wrap around edges
        if (element.x < -100) element.x = canvas.width + 100;
        if (element.x > canvas.width + 100) element.x = -100;
        if (element.y < -100) element.y = canvas.height + 100;
        if (element.y > canvas.height + 100) element.y = -100;

        // Draw element with 3D effect
        ctx.save();
        ctx.translate(element.x + parallaxX, element.y + parallaxY);
        ctx.rotate(element.rotation);
        
        // Apply perspective
        const scale = 1 + element.z / 200;
        ctx.scale(scale, scale);

        // Glassmorphism effect
        ctx.fillStyle = element.color + '20';
        ctx.strokeStyle = element.color + '40';
        ctx.lineWidth = 2;

        if (element.type === 'cube') {
          // Draw cube
          const size = element.size;
          ctx.fillRect(-size/2, -size/2, size, size);
          ctx.strokeRect(-size/2, -size/2, size, size);
          
          // Inner glow
          ctx.fillStyle = element.color + '10';
          ctx.fillRect(-size/2 + 4, -size/2 + 4, size - 8, size - 8);
        } else if (element.type === 'sphere') {
          // Draw sphere
          ctx.beginPath();
          ctx.arc(0, 0, element.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Inner glow
          const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, element.size / 2);
          innerGradient.addColorStop(0, element.color + '30');
          innerGradient.addColorStop(1, element.color + '05');
          ctx.fillStyle = innerGradient;
          ctx.fill();
        } else if (element.type === 'pyramid') {
          // Draw pyramid
          const size = element.size;
          ctx.beginPath();
          ctx.moveTo(0, -size/2);
          ctx.lineTo(-size/2, size/2);
          ctx.lineTo(size/2, size/2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });

      // Connect nearby elements
      elements.forEach((element, index) => {
        elements.slice(index + 1).forEach(otherElement => {
          const dx = otherElement.x - element.x;
          const dy = otherElement.y - element.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            ctx.beginPath();
            ctx.moveTo(element.x, element.y);
            ctx.lineTo(otherElement.x, otherElement.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 * (1 - distance / 200)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Add subtle noise
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 8 - 4;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      
      ctx.putImageData(imageData, 0, 0);

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mousePosition, scrollY]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
    </div>
  );
};

export default StunningBackground;

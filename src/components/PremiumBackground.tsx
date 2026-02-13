// Premium Luxury Background
// Deep charcoal with subtle gradient and noise texture

import React, { useEffect, useRef } from 'react';

const PremiumBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Create noise texture
    const createNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 15 - 7.5; // Subtle noise
        data[i] = noise;     // Red
        data[i + 1] = noise; // Green  
        data[i + 2] = noise; // Blue
        data[i + 3] = 5;     // Alpha (very low opacity)
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    // Create subtle depth animation
    let time = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      time += 0.002;

      // Deep charcoal gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(0.5, '#161616');
      gradient.addColorStop(1, '#0f0f0f');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Very subtle depth animation (under 10% opacity)
      const depthGradient = ctx.createRadialGradient(
        canvas.width * (0.5 + Math.sin(time) * 0.1),
        canvas.height * (0.5 + Math.cos(time) * 0.1),
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.6
      );
      
      depthGradient.addColorStop(0, 'rgba(59, 130, 246, 0.03)'); // Electric blue at 3%
      depthGradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.02)'); // Soft purple at 2%
      depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = depthGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add noise texture
      createNoise();

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default PremiumBackground;

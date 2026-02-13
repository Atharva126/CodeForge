// Ultra Simple Magnetic Background
// Static version without animations

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const UltraSimpleMagneticBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

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

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const clickImpulse = { x: 0, y: 0, strength: 0, t: 0 };
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handlePointerDown = (e: PointerEvent) => {
      clickImpulse.x = e.clientX;
      clickImpulse.y = e.clientY;
      clickImpulse.strength = 1;
      clickImpulse.t = 0;
    };

    const handleScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;
      // Clamp so trackpads don't cause huge impulses
      scrollVelocity += Math.max(-30, Math.min(30, dy));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Floating elements with velocity
    const keywords = [
      'const', 'let', 'var', 'function', 'async', 'await', 'class', 'extends',
      'import', 'export', 'default', 'return', 'try', 'catch', 'finally',
      'if', 'else', 'switch', 'case', 'for', 'while', 'break', 'continue',
      'map', 'filter', 'reduce', 'Promise', 'useEffect', 'useState', 'render'
    ];

    const palette = [
      '#60A5FA', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
      '#84CC16', '#06B6D4', '#F97316', '#A78BFA'
    ];

    const elements = keywords.map((text, i) => {
      const angle = (i / keywords.length) * Math.PI * 2;
      const radius = 220 + (i % 6) * 35;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;

      const x = cx + Math.cos(angle) * radius + (Math.random() - 0.5) * 120;
      const y = cy + Math.sin(angle) * radius + (Math.random() - 0.5) * 120;
      const speed = 0.35 + Math.random() * 0.55;
      const vx = Math.cos(angle + Math.PI / 2) * speed * (Math.random() < 0.5 ? -1 : 1);
      const vy = Math.sin(angle + Math.PI / 2) * speed;

      return {
        x: Math.max(24, Math.min(window.innerWidth - 24, x)),
        y: Math.max(24, Math.min(window.innerHeight - 24, y)),
        vx,
        vy,
        text,
        color: palette[i % palette.length]
      };
    });

    const baseSpeedLimit = 1.2;
    const mouseRadius = 220;
    const mouseForce = 0.025;
    const mouseRepelInnerRadius = 120;
    const separationRadius = 200;
    const separationForce = 0.15;
    const scrollForce = 0.003;
    const impulseForce = 0.07;
    const friction = 0.992;

    let rafId = 0;
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas (transparent background)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth scroll velocity decay
      scrollVelocity *= 0.9;

      // Click impulse decay
      if (clickImpulse.strength > 0.001) {
        clickImpulse.t += 1;
        clickImpulse.strength *= 0.92;
      }

      // Separation: keep elements from clumping/sticking together
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const a = elements[i];
          const b = elements[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.0001 && dist < separationRadius) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            const falloff = 1 - dist / separationRadius;
            const push = separationForce * falloff;

            a.vx -= dirX * push;
            a.vy -= dirY * push;
            b.vx += dirX * push;
            b.vy += dirY * push;
          } else if (dist <= 0.0001) {
            // Rare: exactly overlapping, add tiny random jitter
            const jitterX = (Math.random() - 0.5) * 0.05;
            const jitterY = (Math.random() - 0.5) * 0.05;
            elements[i].vx -= jitterX;
            elements[i].vy -= jitterY;
            elements[j].vx += jitterX;
            elements[j].vy += jitterY;
          }
        }
      }

      // Update element positions and handle boundaries
      elements.forEach((element, i) => {
        // Interaction forces (nudges velocity, keeps original antigravity drift)
        const dxm = mouse.x - element.x;
        const dym = mouse.y - element.y;
        const distM = Math.sqrt(dxm * dxm + dym * dym) || 1;

        if (distM < mouseRadius) {
          // Attract slightly when far, repel gently when very close
          const dirX = dxm / distM;
          const dirY = dym / distM;
          const falloff = (1 - distM / mouseRadius);
          const sign = distM < mouseRepelInnerRadius ? -1 : 1;
          element.vx += dirX * mouseForce * falloff * sign;
          element.vy += dirY * mouseForce * falloff * sign;
        }

        if (clickImpulse.strength > 0.001) {
          const dxc = element.x - clickImpulse.x;
          const dyc = element.y - clickImpulse.y;
          const distC = Math.sqrt(dxc * dxc + dyc * dyc) || 1;
          // Ripple-like push outward (weaker with distance)
          const push = impulseForce * clickImpulse.strength * (1 / (1 + distC / 200));
          element.vx += (dxc / distC) * push;
          element.vy += (dyc / distC) * push;
        }

        // Scroll adds a tiny vertical drift
        element.vy += -scrollVelocity * scrollForce;

        // Add extra separation during fast scrolling to prevent clumping
        if (Math.abs(scrollVelocity) > 5) {
          for (let j = 0; j < elements.length; j++) {
            if (i !== j) {
              const other = elements[j];
              const dx = other.x - element.x;
              const dy = other.y - element.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              if (dist < separationRadius * 1.5) {
                const dirX = dx / dist;
                const dirY = dy / dist;
                const push = 0.1 * (1 - dist / (separationRadius * 1.5));
                element.vx -= dirX * push;
                element.vy -= dirY * push;
              }
            }
          }
        }

        // Tiny friction so interactions settle
        element.vx *= friction;
        element.vy *= friction;

        // Clamp speed to keep motion calm
        const speed = Math.sqrt(element.vx * element.vx + element.vy * element.vy);
        if (speed > baseSpeedLimit) {
          element.vx = (element.vx / speed) * baseSpeedLimit;
          element.vy = (element.vy / speed) * baseSpeedLimit;
        }

        // Update position based on velocity
        element.x += element.vx;
        element.y += element.vy;

        // Bounce off edges (space-like floating without gravity)
        if (element.x <= 0 || element.x >= canvas.width) {
          element.vx *= -1;
          element.x = Math.max(0, Math.min(canvas.width, element.x));
        }
        if (element.y <= 0 || element.y >= canvas.height) {
          element.vy *= -1;
          element.y = Math.max(0, Math.min(canvas.height, element.y));
        }

        // Draw element
        ctx.save();
        ctx.translate(element.x, element.y);

        const isDark = resolvedTheme === 'dark';

        // Subtle glow (only in dark mode)
        if (isDark) {
          ctx.shadowColor = element.color;
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        ctx.fillStyle = element.color;
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = isDark ? 0.3 : 0.6;
        ctx.fillText(element.text, 0, 0);
        ctx.restore();
      });

      // Add vignette
      const isDark = resolvedTheme === 'dark';
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );

      if (isDark) {
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      } else {
        vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
        vignette.addColorStop(1, 'rgba(237, 244, 255, 0.2)');
      }
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Continue animation
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      // Animation will stop when component unmounts due to requestAnimationFrame cleanup
    };
  }, [resolvedTheme]);

  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default UltraSimpleMagneticBackground;

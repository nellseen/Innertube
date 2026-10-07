import React, { useRef, useEffect } from 'react';
import type { SceneType } from '../../contexts/SceneContext.js';
import { usePlayer } from '../../contexts/PlayerContext.js';

interface SceneCanvasProps {
  sceneType: SceneType;
  className?: string;
  dimOverlay?: number; // 0 to 1
  albumArt?: string;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  sceneType,
  className = '',
  dimOverlay = 0,
  albumArt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, volume } = usePlayer();
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // --- SCENE 1: Stardust Particles ---
    const stars: { x: number; y: number; r: number; alpha: number; speed: number; color: string }[] = [];
    const starColors = ['#06b6d4', '#6366f1', '#a855f7', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 140; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 0.6,
        alpha: Math.random() * 0.8 + 0.2,
        speed: (Math.random() * 0.4 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    // --- SCENE 4: Rain Drops & Ripples ---
    const rainDrops: { x: number; y: number; l: number; v: number; a: number }[] = [];
    for (let i = 0; i < 90; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        l: Math.random() * 24 + 10,
        v: Math.random() * 10 + 6,
        a: Math.random() * 0.4 + 0.2,
      });
    }

    let time = 0;
    let vinylAngle = 0;

    const render = () => {
      time += 0.015;
      const activeSpeed = isPlayingRef.current ? 1.4 : 0.4;
      const volMultiplier = Math.max(0.4, volumeRef.current || 0.8);

      ctx.clearRect(0, 0, width, height);

      // Render based on active scene type
      if (sceneType === 'stardust') {
        // Cosmic Nebulae background gradients
        const grad1 = ctx.createRadialGradient(
          width * 0.3 + Math.sin(time * 0.5) * 50,
          height * 0.4 + Math.cos(time * 0.4) * 40,
          10,
          width * 0.3,
          height * 0.4,
          width * 0.6
        );
        grad1.addColorStop(0, 'rgba(99, 102, 241, 0.22)');
        grad1.addColorStop(0.5, 'rgba(6, 182, 212, 0.12)');
        grad1.addColorStop(1, 'rgba(9, 10, 15, 0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        const grad2 = ctx.createRadialGradient(
          width * 0.7 + Math.cos(time * 0.6) * 60,
          height * 0.6 + Math.sin(time * 0.5) * 50,
          10,
          width * 0.7,
          height * 0.6,
          width * 0.5
        );
        grad2.addColorStop(0, 'rgba(244, 63, 94, 0.16)');
        grad2.addColorStop(0.6, 'rgba(168, 85, 247, 0.1)');
        grad2.addColorStop(1, 'rgba(9, 10, 15, 0)');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);

        // Draw star particles
        for (const star of stars) {
          star.y += star.speed * activeSpeed;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;

          const twinkle = Math.sin(time * 2 + star.x) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r * (isPlayingRef.current ? 1.2 : 1), 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = star.alpha * twinkle * volMultiplier;
          ctx.shadowBlur = 8;
          ctx.shadowColor = star.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      } else if (sceneType === 'waves') {
        // Multi-frequency harmonic neon sine wave ribbons
        const centerY = height * 0.55;
        const waveCount = 5;

        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const frequency = 0.003 + w * 0.0012;
          const amplitude = (35 + w * 18) * (isPlayingRef.current ? 1.6 : 0.6) * volMultiplier;
          const phase = time * (1.2 + w * 0.4) * activeSpeed;

          ctx.moveTo(0, centerY);
          for (let x = 0; x <= width; x += 4) {
            const y =
              centerY +
              Math.sin(x * frequency + phase) * amplitude +
              Math.cos(x * 0.0015 + phase * 0.5) * (amplitude * 0.4);
            ctx.lineTo(x, y);
          }

          const colors = [
            'rgba(6, 182, 212, 0.65)',
            'rgba(99, 102, 241, 0.55)',
            'rgba(168, 85, 247, 0.5)',
            'rgba(56, 189, 248, 0.45)',
            'rgba(244, 63, 94, 0.4)',
          ];

          ctx.strokeStyle = colors[w % colors.length];
          ctx.lineWidth = 2.5 + w * 0.5;
          ctx.shadowBlur = 16;
          ctx.shadowColor = colors[w % colors.length];
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else if (sceneType === 'aurora') {
        // Organic undulating northern lights ribbons
        const bands = 4;
        for (let b = 0; b < bands; b++) {
          const auroraGrad = ctx.createLinearGradient(0, height * 0.2, 0, height * 0.9);
          if (b % 2 === 0) {
            auroraGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
            auroraGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.35)');
            auroraGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.25)');
            auroraGrad.addColorStop(1, 'rgba(9, 10, 15, 0)');
          } else {
            auroraGrad.addColorStop(0, 'rgba(168, 85, 247, 0)');
            auroraGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.3)');
            auroraGrad.addColorStop(0.8, 'rgba(52, 211, 153, 0.2)');
            auroraGrad.addColorStop(1, 'rgba(9, 10, 15, 0)');
          }

          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 8) {
            const y =
              height * 0.35 +
              b * 45 +
              Math.sin(x * 0.002 + time * 0.6 * activeSpeed + b) * 70 * volMultiplier +
              Math.cos(x * 0.004 - time * 0.4) * 35;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.closePath();
          ctx.fillStyle = auroraGrad;
          ctx.fill();
        }
      } else if (sceneType === 'rain') {
        // Lo-fi city ambient glow behind rain
        const cityGlow = ctx.createRadialGradient(
          width * 0.5,
          height * 0.8,
          50,
          width * 0.5,
          height * 0.8,
          width * 0.7
        );
        cityGlow.addColorStop(0, 'rgba(244, 63, 94, 0.2)');
        cityGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
        cityGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cityGlow;
        ctx.fillRect(0, 0, width, height);

        // Falling rain streaks
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
        ctx.lineWidth = 1.2;
        for (const drop of rainDrops) {
          drop.y += drop.v * (isPlayingRef.current ? 1.3 : 0.8);
          if (drop.y > height) {
            drop.y = -20;
            drop.x = Math.random() * width;
          }

          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.l);
          ctx.stroke();
        }

        // Glass ripple droplets
        for (let i = 0; i < 8; i++) {
          const rx = (Math.sin(i * 1.7 + time * 0.2) * 0.4 + 0.5) * width;
          const ry = (Math.cos(i * 2.3 + time * 0.25) * 0.4 + 0.5) * height;
          const radius = (Math.sin(time * 2 + i) * 0.5 + 0.5) * 16 + 4;
          ctx.beginPath();
          ctx.arc(rx, ry, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else if (sceneType === 'vinyl') {
        // Vinyl turntable ambient scene
        const cx = width * 0.5;
        const cy = height * 0.5;
        const maxRadius = Math.min(width, height) * 0.36;

        if (isPlayingRef.current) {
          vinylAngle += 0.015 * volMultiplier;
        }

        // Turntable shadow
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(vinylAngle);

        // Main disc body
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0a0d';
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.25)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Concentric Vinyl Grooves
        for (let r = maxRadius * 0.38; r < maxRadius * 0.96; r += 7) {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Reflective Sheen Cones
        const sheenGrad = ctx.createLinearGradient(-maxRadius, -maxRadius, maxRadius, maxRadius);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius * 0.96, 0, Math.PI * 2);
        ctx.fill();

        // Center Label Rim
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fill();

        // Center Spindle Hole
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Dimming overlay if configured
      if (dimOverlay > 0) {
        ctx.fillStyle = `rgba(9, 10, 15, ${Math.min(1, dimOverlay)})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [sceneType, dimOverlay]);

  return <canvas ref={canvasRef} className={`w-full h-full block ${className}`} />;
};

import { useEffect, useRef } from 'react';

// Concert-lighting color palettes: [gradientStart, gradientMid, gradientEnd, accent]
const PALETTES = [
  ['#0a0a2e', '#1a0533', '#0d1a4a', '#7c3aed'],
  ['#0f172a', '#1e1b4b', '#0c1445', '#3b82f6'],
  ['#1a0a00', '#2d1b69', '#0a0f2e', '#f59e0b'],
  ['#0d0020', '#1e0040', '#0a1628', '#8b5cf6'],
  ['#00101a', '#001a3a', '#0d0f2e', '#06b6d4'],
  ['#1a0028', '#2a0a45', '#0f0a20', '#ec4899'],
  ['#0a1a00', '#0f2040', '#1a0a30', '#84cc16'],
  ['#1a1000', '#2a1a00', '#0a0a2e', '#f97316'],
  ['#000a1a', '#00152e', '#0a0020', '#38bdf8'],
  ['#1a0015', '#2e0030', '#0a1520', '#a855f7'],
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Background() {
  const palette = useRef(pickRandom(PALETTES)).current;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animFrame;
    let t = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    const [c0r, c0g, c0b] = hexToRgb(palette[0]);
    const [c1r, c1g, c1b] = hexToRgb(palette[1]);
    const [c2r, c2g, c2b] = hexToRgb(palette[2]);
    const [acR, acG, acB] = hexToRgb(palette[3]);

    function draw() {
      const { width: w, height: h } = canvas;
      t += 0.003;

      // Multi-point radial gradient blending
      const grd = ctx.createLinearGradient(
        w * (0.3 + 0.2 * Math.sin(t)),
        0,
        w * (0.7 + 0.1 * Math.cos(t * 0.7)),
        h
      );
      const mix = (0.5 + 0.5 * Math.sin(t * 0.6));
      grd.addColorStop(0, `rgb(${c0r},${c0g},${c0b})`);
      grd.addColorStop(0.4 + 0.1 * Math.sin(t), `rgb(${c1r},${c1g},${c1b})`);
      grd.addColorStop(1, `rgb(${c2r},${c2g},${c2b})`);

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Subtle accent light orb
      const orbX = w * (0.5 + 0.3 * Math.sin(t * 0.4));
      const orbY = h * (0.35 + 0.15 * Math.cos(t * 0.3));
      const orbR = w * 0.4;
      const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR);
      orb.addColorStop(0, `rgba(${acR},${acG},${acB},${0.06 + 0.04 * Math.sin(t * 2)})`);
      orb.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, w, h);

      // Noise overlay (cheap static noise)
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() - 0.5) * 8;
        d[i] = Math.min(255, Math.max(0, d[i] + n));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
      }
      ctx.putImageData(imageData, 0, 0);

      animFrame = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        opacity: 0,
        animation: 'fadeIn 2s ease forwards',
      }}
    />
  );
}

import { useEffect, useRef } from 'react';

const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWave = (
      yOffset: number,
      amplitude: number,
      frequency: number,
      speed: number,
      opacity: number,
      color: string
    ) => {
      if (!ctx || !canvas) return;
      
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let x = 0; x <= canvas.width; x += 2) {
        const y =
          yOffset +
          Math.sin(x * frequency + time * speed) * amplitude +
          Math.sin(x * frequency * 0.5 + time * speed * 0.7) * amplitude * 0.5;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, canvas.height);
      gradient.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${color}00`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#0a0f1a');
      bgGradient.addColorStop(0.5, '#0d1520');
      bgGradient.addColorStop(1, '#0a0f1a');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw multiple wave layers
      drawWave(canvas.height * 0.85, 30, 0.003, 0.5, 0.08, '#06b6d4');
      drawWave(canvas.height * 0.8, 40, 0.004, 0.6, 0.06, '#0891b2');
      drawWave(canvas.height * 0.75, 50, 0.002, 0.4, 0.04, '#0e7490');
      drawWave(canvas.height * 0.9, 20, 0.005, 0.8, 0.1, '#22d3ee');

      // Add some floating particles
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        const x = (i * canvas.width / particleCount + time * 10) % canvas.width;
        const y = canvas.height * 0.3 + Math.sin(i + time * 0.5) * 100;
        const size = 1 + Math.sin(i * 0.5 + time) * 0.5;
        const opacity = 0.1 + Math.sin(i + time) * 0.1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
        ctx.fill();
      }

      time += 0.01;
      animationId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'linear-gradient(180deg, #0a0f1a 0%, #0d1520 100%)' }}
    />
  );
};

export default WaveBackground;

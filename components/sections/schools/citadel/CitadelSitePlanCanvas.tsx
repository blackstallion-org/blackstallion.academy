"use client";

import React, { useEffect, useRef } from "react";
import { HORSE_PATHS } from "./citadelData";

interface CitadelSitePlanCanvasProps {
  currentHub: 'standard' | 'signature' | 'royal';
  onZoneClick?: (facilityKey: string) => void;
  className?: string;
  width?: number;
  height?: number;
}

export function CitadelSitePlanCanvas({
  currentHub,
  onZoneClick,
  className = "w-full h-full cursor-pointer",
  width = 680,
  height = 330
}: CitadelSitePlanCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTime = performance.now();

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      const timeSec = (performance.now() - startTime) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#EFE7D6';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(107, 58, 36, 0.07)';
      ctx.lineWidth = 1;
      const gStep = Math.round(w / 20);
      for (let x = 0; x < w; x += gStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const padX = w * 0.11;
      const padY = h * 0.12;
      ctx.fillStyle = '#DFD5C0';
      ctx.strokeStyle = '#8C7A65';
      ctx.lineWidth = 1.5;
      ctx.fillRect(padX, padY, w - padX * 2, h - padY * 2);
      ctx.strokeRect(padX, padY, w - padX * 2, h - padY * 2);

      const arenaX = w * 0.22;
      const arenaY = h * 0.20;
      const arenaW = w * 0.48;
      const arenaH = h * 0.52;

      ctx.fillStyle = '#DFC7A7';
      ctx.fillRect(arenaX, arenaY, arenaW, arenaH);
      ctx.strokeStyle = '#5B3A24';
      ctx.lineWidth = 3;
      ctx.strokeRect(arenaX, arenaY, arenaW, arenaH);

      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(107, 58, 36, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(arenaX + 10, arenaY + 10, arenaW - 20, arenaH - 20);
      ctx.restore();

      if (currentHub === 'signature' || currentHub === 'royal') {
        ctx.save();
        ctx.strokeStyle = 'rgba(107, 58, 36, 0.22)';
        ctx.lineWidth = 1.5;
        for (let i = 1; i < 6; i++) {
          const rx = arenaX + (arenaW * i) / 6;
          ctx.beginPath();
          ctx.moveTo(rx, arenaY - 4);
          ctx.lineTo(rx, arenaY + arenaH + 4);
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.fillStyle = '#2B211B';
      ctx.font = `600 ${Math.max(10, Math.round(w * 0.017))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SAND ARENA', arenaX + arenaW / 2, arenaY + arenaH * 0.32);

      ctx.fillStyle = '#6B3A24';
      HORSE_PATHS.forEach(hp => {
        const ang = timeSec * hp.speed + hp.phase;
        const hx = arenaX + arenaW * 0.5 + Math.cos(ang) * (arenaW * 0.32);
        const hy = arenaY + arenaH * 0.55 + Math.sin(ang) * (arenaH * 0.28);
        ctx.beginPath();
        ctx.arc(hx, hy, Math.max(3.5, w * 0.006), 0, Math.PI * 2);
        ctx.fill();
      });

      const stX = arenaX;
      const stY = arenaY + arenaH + h * 0.04;
      const stW = arenaW * 0.62;
      const stH = h * 0.14;
      ctx.fillStyle = '#EFE9DD';
      ctx.strokeStyle = '#3D2B1F';
      ctx.lineWidth = 2;
      ctx.fillRect(stX, stY, stW, stH);
      ctx.strokeRect(stX, stY, stW, stH);
      for (let i = 1; i < 4; i++) {
        const dx = stX + (stW * i) / 4;
        ctx.beginPath(); ctx.moveTo(dx, stY); ctx.lineTo(dx, stY + stH); ctx.stroke();
      }
      ctx.fillStyle = '#1A1512';
      ctx.fillText('4 STABLES', stX + stW / 2, stY + stH * 0.62);

      const tkX = arenaX + arenaW + w * 0.025;
      const tkY = arenaY + arenaH * 0.26;
      const tkW = w * 0.12;
      const tkH = arenaH * 0.48;
      ctx.fillStyle = '#EFE9DD';
      ctx.fillRect(tkX, tkY, tkW, tkH);
      ctx.strokeRect(tkX, tkY, tkW, tkH);
      ctx.fillStyle = '#1A1512';
      ctx.fillText('TACK', tkX + tkW / 2, tkY + tkH * 0.55);

      if (currentHub === 'signature' || currentHub === 'royal') {
        const nStY = arenaY - h * 0.15;
        ctx.fillStyle = '#E8DEC8';
        ctx.strokeStyle = '#6B3A24';
        ctx.fillRect(stX, nStY, stW, h * 0.11);
        ctx.strokeRect(stX, nStY, stW, h * 0.11);
        ctx.fillStyle = '#6B3A24';
        ctx.fillText('+4 STABLES (NORTH WING)', stX + stW / 2, nStY + h * 0.07);
      }

      if (currentHub === 'royal') {
        const wStX = arenaX - w * 0.095;
        ctx.fillStyle = '#E8DEC8';
        ctx.strokeStyle = '#6B3A24';
        ctx.fillRect(wStX, arenaY, w * 0.075, arenaH);
        ctx.strokeRect(wStX, arenaY, w * 0.075, arenaH);

        const colX = arenaX + arenaW * 0.64;
        const colY = arenaY - h * 0.15;
        ctx.fillRect(colX, colY, arenaW * 0.52, h * 0.11);
        ctx.strokeRect(colX, colY, arenaW * 0.52, h * 0.11);
        ctx.fillStyle = '#6B3A24';
        ctx.fillText('ROYAL COLONNADE', colX + (arenaW * 0.52) / 2, colY + h * 0.07);
      }

      const treeDots = [
        [arenaX - 18, arenaY - 10], [arenaX - 18, arenaY + arenaH * 0.4], [arenaX - 18, arenaY + arenaH * 0.85],
        [arenaX + arenaW * 0.8, stY + stH * 0.5], [arenaX + arenaW * 0.95, stY + stH * 0.5],
        [tkX + tkW * 0.5, arenaY + 8], [tkX + tkW * 0.5, arenaY + arenaH - 6]
      ];
      treeDots.forEach(([tx, ty]) => {
        ctx.fillStyle = '#556644';
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(6, w * 0.012), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#75895E';
        ctx.beginPath();
        ctx.arc(tx - 2, ty - 2, Math.max(3, w * 0.006), 0, Math.PI * 2);
        ctx.fill();
      });
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentHub]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onZoneClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    if (nx > 0.68) {
      onZoneClick('tack');
    } else if (ny > 0.72) {
      onZoneClick('stables');
    } else if (ny < 0.24 && currentHub === 'royal') {
      onZoneClick('pavilion');
    } else if (ny < 0.24 && currentHub === 'signature') {
      onZoneClick('expansion');
    } else {
      onZoneClick('arena');
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className={className}
      title="Click zone to focus 3D"
    />
  );
}

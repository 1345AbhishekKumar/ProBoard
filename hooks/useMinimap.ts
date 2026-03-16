import { useCallback, useEffect } from 'react';
import { useAppContext } from '@/lib/AppContext';

export const useMinimap = () => {
  const { stateRef, minimapCanvasRef, minimapViewportRef } = useAppContext();

  const renderMinimap = useCallback(() => {
    if (!minimapCanvasRef.current || !minimapViewportRef.current) return;
    const canvas = minimapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const notes = stateRef.current.notes[stateRef.current.currentFolder] || [];
    if (!notes.length) {
      minimapViewportRef.current.style.display = 'none';
      return;
    }
    minimapViewportRef.current.style.display = 'block';
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    notes.forEach(n => {
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x + n.w);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y + n.h);
    });
    
    const vx = -stateRef.current.view.x / stateRef.current.view.zoom;
    const vy = -stateRef.current.view.y / stateRef.current.view.zoom;
    const vw = window.innerWidth / stateRef.current.view.zoom;
    const vh = window.innerHeight / stateRef.current.view.zoom;
    
    const totalMinX = Math.min(minX, vx);
    const totalMaxX = Math.max(maxX, vx + vw);
    const totalMinY = Math.min(minY, vy);
    const totalMaxY = Math.max(maxY, vy + vh);
    
    const width = totalMaxX - totalMinX;
    const height = totalMaxY - totalMinY;
    const scale = Math.min(w / width, h / height) * 0.9;
    
    const offsetX = (w - width * scale) / 2 - totalMinX * scale;
    const offsetY = (h - height * scale) / 2 - totalMinY * scale;

    notes.forEach(n => {
      ctx.fillStyle = '#cbd5e1';
      if (n.color === 'yellow') ctx.fillStyle = '#fcd34d';
      if (n.color === 'blue') ctx.fillStyle = '#93c5fd';
      if (n.color === 'red') ctx.fillStyle = '#fca5a5';
      if (n.color === 'green') ctx.fillStyle = '#bbf7d0';
      if (n.color === 'purple') ctx.fillStyle = '#e9d5ff';
      if (n.color === 'orange') ctx.fillStyle = '#fed7aa';
      ctx.fillRect(n.x * scale + offsetX, n.y * scale + offsetY, n.w * scale, n.h * scale);
    });
    
    const vp = minimapViewportRef.current;
    vp.style.left = `${vx * scale + offsetX}px`;
    vp.style.top = `${vy * scale + offsetY}px`;
    vp.style.width = `${vw * scale}px`;
    vp.style.height = `${vh * scale}px`;
  }, [minimapCanvasRef, minimapViewportRef, stateRef]);

  useEffect(() => {
    renderMinimap();
  });

  return { renderMinimap };
};

import React from 'react';
import { useAppContext } from '@/lib/AppContext';

export default function Minimap() {
  const { minimapCanvasRef, minimapViewportRef } = useAppContext();

  return (
    <div className="absolute bottom-6 right-6 w-[220px] h-[150px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl overflow-hidden shadow-sm z-40 hover:scale-105 transition-transform origin-bottom-right">
      <canvas ref={minimapCanvasRef} width={220} height={150} className="w-full h-full" />
      <div
        ref={minimapViewportRef}
        className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none"
      />
    </div>
  );
}

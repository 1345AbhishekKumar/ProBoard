'use client';

import React from 'react';
import { AppProvider, useAppContext } from '@/lib/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Canvas from '@/components/Canvas';
import TrashOverlay from '@/components/TrashOverlay';
import Minimap from '@/components/Minimap';
import ContextMenu from '@/components/ContextMenu';

function AppContent() {
  const { isMounted } = useAppContext();

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-700 font-sans select-none">
      <Sidebar />
      <main className="flex-1 relative h-full flex flex-col shadow-2xl z-10 bg-slate-50">
        <Header />
        <Canvas />
        <TrashOverlay />
        <Minimap />
      </main>
      <ContextMenu />
    </div>
  );
}

export default function CorkboardApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

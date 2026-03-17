'use client';

import React, { useEffect, useState } from 'react';
import { AppProvider, useAppContext } from '@/lib/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Canvas from '@/components/Canvas';
import TrashOverlay from '@/components/TrashOverlay';
import Minimap from '@/components/Minimap';
import ContextMenu from '@/components/ContextMenu';
import Auth from '@/components/Auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { AlertCircle, Settings, Loader2 } from 'lucide-react';

function MainApp() {
  const { isMounted } = useAppContext();

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      })
      .catch(err => {
        console.error('Auth error:', err);
        setError('Failed to connect to authentication service. Please check your Supabase configuration.');
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Configuration Required</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Please set your Supabase environment variables in the settings menu to enable authentication.
          </p>
          <div className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs">
            <div className="text-slate-400"># Required variables:</div>
            <div className="text-slate-700">NEXT_PUBLIC_SUPABASE_URL</div>
            <div className="text-slate-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Connection Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <AppProvider userId={session.user.id}>
      <MainApp />
    </AppProvider>
  );
}

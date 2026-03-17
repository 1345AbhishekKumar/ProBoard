'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    // Supabase automatically processes the URL hash/query parameters
    // when the client is initialized. We just need to wait a moment
    // and then notify the parent window.
    const processAuth = async () => {
      try {
        await supabase.auth.getSession();
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error processing auth callback:', error);
      }
    };

    processAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Completing authentication...</p>
        <p className="text-slate-400 text-sm mt-2">This window should close automatically.</p>
      </div>
    </div>
  );
}

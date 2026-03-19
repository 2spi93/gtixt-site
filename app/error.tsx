'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const CHUNK_RELOAD_COUNT_KEY = '__chunk_reload_count__';
const MAX_CHUNK_RECOVERY_ATTEMPTS = 3;

function isExtensionNoise(error: Error & { digest?: string }) {
  const message = (error?.message || '').toLowerCase();
  const stack = (error?.stack || '').toLowerCase();
  
  return (
    message.includes('origin not allowed') || 
    message.includes('func sseerror') ||
    message.includes('func sseError') ||
    message.includes('extension context') ||
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://') ||
    stack.includes('inpage.js')
  );
}

function isChunkLoadError(error: Error & { digest?: string }) {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('chunkloaderror') ||
    message.includes('failed to load chunk') ||
    message.includes('loading chunk') ||
    message.includes('/_next/static/chunks/')
  );
}

function recoverChunkLoad() {
  try {
    const attempts = Number.parseInt(sessionStorage.getItem(CHUNK_RELOAD_COUNT_KEY) || '0', 10) || 0;
    if (attempts >= MAX_CHUNK_RECOVERY_ATTEMPTS) return false;
    const nextAttempt = attempts + 1;
    sessionStorage.setItem(CHUNK_RELOAD_COUNT_KEY, String(nextAttempt));
    const url = new URL(window.location.href);
    url.searchParams.set('__chunk_retry', String(nextAttempt));
    url.searchParams.set('__chunk_ts', String(Date.now()));
    window.location.replace(url.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for debugging
    console.error('Application Error:', error);

    if (isChunkLoadError(error)) {
      const timer = setTimeout(() => {
        recoverChunkLoad();
      }, 250);
      return () => clearTimeout(timer);
    }

    if (isExtensionNoise(error)) {
      const timer = setTimeout(() => reset(), 0);
      return () => clearTimeout(timer);
    }
  }, [error, reset]);

  if (isExtensionNoise(error)) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="text-center max-w-lg bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-7xl font-bold text-red-600 mb-4">⚠️</h1>
        <h2 className="text-3xl font-bold text-red-900 mb-4">Something Went Wrong</h2>
        <p className="text-gray-600 text-lg mb-4">
          An unexpected error occurred while processing your request.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          The page can usually recover automatically. If it does not, retry once or inspect the technical details below.
        </p>
        
        {error.message && (
          <details className="mb-6 rounded-lg border border-red-200 bg-red-50 text-left">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-red-800">
              View technical details
            </summary>
            <div className="border-t border-red-200 px-4 py-3">
              <p className="text-xs font-mono text-red-700 break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          </details>
        )}

        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition"
          >
            🔄 Try Again
          </button>
          
          <Link
            href="/admin"
            className="w-full inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            🏠 Back to Dashboard
          </Link>

          <Link
            href="/admin/info"
            className="w-full inline-block px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
          >
            📚 Get Help
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If the problem persists, please contact support with the error ID above.
          </p>
        </div>
      </div>
    </div>
  );
}

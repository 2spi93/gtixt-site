'use client';

import Link from 'next/link';
import { useEffect } from 'react';

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
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
      <div className="text-center max-w-lg bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-7xl font-bold text-red-600 mb-4">⚠️</h1>
        <h2 className="text-3xl font-bold text-red-900 mb-4">Something Went Wrong</h2>
        <p className="text-gray-600 text-lg mb-4">
          An unexpected error occurred while processing your request.
        </p>
        
        {/* Error Details (dev only) */}
        {error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-red-700 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
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

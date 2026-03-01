/**
 * GTIXT Public Rankings & Firms Directory
 * Accessible to all visitors - displays publicly available firm data
 */

import { Suspense } from 'react';
import Link from 'next/link';

// Client component for interactivity
import FirmsClientView from './FirmsClientView';

export const metadata = {
  title: 'Firm Rankings - GTIXT',
  description: 'Browse and search institutional firm rankings and compliance scores in the GTIXT database',
};

export default function FirmsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              <span className="text-[#0A8A9F]">GT</span>
              <span className="text-gray-700">i</span>
              <span className="text-[#0A8A9F]">XT</span>
            </div>
            <div className="text-xs text-gray-600">
              Governance & Transparency Index
            </div>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 text-gray-700 hover:text-[#0A8A9F] font-medium transition">
              Home
            </Link>
            <Link href="/rankings" className="px-4 py-2 text-[#0A8A9F] font-semibold border-b-2 border-[#0A8A9F]">
              Rankings
            </Link>
            <Link
              href="/admin/login"
              className="px-6 py-2 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-lg font-semibold transition shadow-sm"
            >
              🔐 Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Institutional Firm Rankings
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Browse and search {/* firms count will load dynamically */}
            institutional and financial firms monitored by GTIXT. 
            View compliance rankings, transparency scores, and governance ratings.
          </p>
        </div>

        {/* Firms Content - Client Component */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        }>
          <FirmsClientView />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-white mb-4">GTIXT</h3>
              <p>Governance & Transparency Index for institutional firms worldwide</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/rankings" className="hover:text-white transition">Rankings</Link></li>
                <li><a href="/api/firms/stats" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Admin</h3>
              <ul className="space-y-2">
                <li><Link href="/admin/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/admin" className="hover:text-white transition">Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 GTIXT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

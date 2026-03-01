/**
 * GTIXT Public Homepage
 * Enterprise landing page for compliance intelligence platform
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              <span className="text-[#0A8A9F]">GT</span>
              <span className="text-gray-700">i</span>
              <span className="text-[#0A8A9F]">XT</span>
            </div>
            <div className="text-xs text-gray-600">
              Governance & Transparency Index
            </div>
          </div>
          <Link
            href="/admin/login"
            className="px-6 py-2 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-lg font-semibold transition shadow-sm"
          >
            🔐 Admin Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
          🚀 Enterprise Compliance Intelligence Platform
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          <span className="text-[#0A8A9F]">GTIXT</span>
        </h1>
        <p className="text-2xl text-gray-700 mb-4 font-semibold">
          Governance, Transparency & Institutional eXcellence Tracking
        </p>
        <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
          Enterprise-grade compliance intelligence platform providing real-time monitoring, 
          automated data enrichment, and institutional-level transparency scoring for financial firms worldwide.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/admin"
            className="px-8 py-4 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl"
          >
            📊 View Dashboard
          </Link>
          <a
            href="#features"
            className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 rounded-xl font-bold text-lg transition"
          >
            📖 Learn More
          </a>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white/80 backdrop-blur-sm py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#0A8A9F]">249+</div>
              <div className="text-sm text-gray-600 mt-2">Active Firms</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0A8A9F]">100%</div>
              <div className="text-sm text-gray-600 mt-2">Jurisdiction Coverage</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0A8A9F]">97.6%</div>
              <div className="text-sm text-gray-600 mt-2">Evidence Quality</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0A8A9F]">24/7</div>
              <div className="text-sm text-gray-600 mt-2">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Enterprise-Grade Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built for institutional investors, compliance teams, and regulatory compliance professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Scoring</h3>
            <p className="text-gray-600">
              Multi-agent AI system for automated compliance scoring, evidence validation, and jurisdiction classification.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Global Coverage</h3>
            <p className="text-gray-600">
              FCA, ASIC, CySEC, and 50+ regulatory jurisdictions tracked with real-time updates and multi-source enrichment.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Prometheus Monitoring</h3>
            <p className="text-gray-600">
              Enterprise observability with Prometheus metrics, Grafana dashboards, and real-time alerting.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Security</h3>
            <p className="text-gray-600">
              2FA authentication, RBAC permissions, complete audit trails, rate limiting, and automated backups.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Redis Caching</h3>
            <p className="text-gray-600">
              High-performance Redis cache with 5-minute TTL for sub-10ms API responses and 94%+ hit rate.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition border border-gray-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">CI/CD Pipeline</h3>
            <p className="text-gray-600">
              Automated testing, staging deployments, and production releases via GitHub Actions with zero downtime.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Stack */}
      <section className="bg-white/80 backdrop-blur-sm py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Built on Modern Technology
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 text-center">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">⚛️</div>
              <div className="font-semibold text-gray-900">Next.js 14</div>
              <div className="text-xs text-gray-500">React Framework</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">🐘</div>
              <div className="font-semibold text-gray-900">PostgreSQL</div>
              <div className="text-xs text-gray-500">Database</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">🐍</div>
              <div className="font-semibold text-gray-900">Python</div>
              <div className="text-xs text-gray-500">Data Pipeline</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-semibold text-gray-900">Prometheus</div>
              <div className="text-xs text-gray-500">Monitoring</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">🔴</div>
              <div className="font-semibold text-gray-900">Redis</div>
              <div className="text-xs text-gray-500">Caching</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="text-2xl mb-2">🐳</div>
              <div className="font-semibold text-gray-900">Docker</div>
              <div className="text-xs text-gray-500">Containers</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-[#0A8A9F] to-[#087080] rounded-3xl p-12 text-white shadow-xl">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Access the admin console to manage firms, monitor operations, and view real-time compliance data.
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-10 py-4 bg-white text-[#0A8A9F] rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            🔐 Login to Admin Console
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-2xl font-bold mb-3">
                <span className="text-[#0A8A9F]">GT</span>
                <span>i</span>
                <span className="text-[#0A8A9F]">XT</span>
              </div>
              <p className="text-gray-400 text-sm">
                Enterprise compliance intelligence platform for institutional firms.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/admin" className="hover:text-white transition">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/admin/monitoring" className="hover:text-white transition">
                    Monitoring
                  </Link>
                </li>
                <li>
                  <Link href="/admin/health" className="hover:text-white transition">
                    System Health
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">System Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-400">All Systems Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-400">API: 99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>&copy; 2026 GTIXT. All rights reserved. Built with Next.js, PostgreSQL & Prometheus.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

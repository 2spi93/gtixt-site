import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-7xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 text-lg mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            🏠 Back to Dashboard
          </Link>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <Link href="/admin/audit" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition">
              📋 Audit
            </Link>
            <Link href="/admin/jobs" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition">
              ⚙️ Jobs
            </Link>
            <Link href="/admin/info" className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition">
              📚 Help
            </Link>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Error Code: 404 - Resource Not Found</p>
          <p className="mt-2">If you believe this is a mistake, contact the support team.</p>
        </div>
      </div>
    </div>
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      {
        source: '/snapshots/:path*',
        destination: 'http://localhost:9002/gpti-snapshots/:path*',
      },
      {
        source: '/api/gpti/:path*',
        destination: 'https://gtixt.com/gpti-snapshots/:path*',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon/icon.svg',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/rankings',
        permanent: true,
      },
      {
        source: '/index/',
        destination: '/rankings',
        permanent: true,
      },
      {
        source: '/firms',
        destination: '/rankings',
        permanent: true,
      },
      {
        source: '/firms/',
        destination: '/rankings',
        permanent: true,
      },
      // Redirection de /firm/?id=X vers /firm/X (dynamic route)
      {
        source: '/firm/',
        has: [
          {
            type: 'query',
            key: 'id',
            value: '(?<firmId>.*)',
          },
        ],
        destination: '/firm/:firmId',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ],
      },
    ]
  },
  compress: true,
}

// Use Node.js server instead of static export to support API routes
// nextConfig.output = 'export' is disabled for production to enable API endpoints

module.exports = nextConfig

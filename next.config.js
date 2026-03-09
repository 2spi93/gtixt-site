/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: false,  // Disable to prevent static file serving issues
  pageExtensions: ['ts', 'tsx'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    const minioBase = process.env.NEXT_PUBLIC_MINIO_BASE || 'http://localhost:9002/gpti-snapshots';
    return [
      {
        source: '/snapshots/:path*',
        destination: `${minioBase}/:path*`,
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
      // Static assets - must be served with correct MIME type
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/industry-map',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          },
        ],
      },
      {
        source: '/industry-map/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          },
        ],
      },
      {
        source: '/analytics',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          },
        ],
      },
      {
        source: '/analytics/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
          },
        ],
      },
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
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https: http:; font-src 'self' data: https://fonts.gstatic.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
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
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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

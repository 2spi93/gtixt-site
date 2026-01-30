/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/gpti/:path*',
        destination: 'https://gtixt.com/gpti-snapshots/:path*',
      },
    ]
  },
}

module.exports = nextConfig
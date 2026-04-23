/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Cualquier petición que el frontend haga a /api/...
        source: '/api/:path*',
        // Será redirigida internamente (proxy) a tu backend en el puerto 3000
        destination: 'http://localhost:3000/api/:path*',
      },
    ]
  },
};

export default nextConfig;
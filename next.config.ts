import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Redirect old Jugar route to the Partidas wall
      {
        source: '/play',
        destination: '/activities?view=partidas',
        permanent: false,
      },
      // Strip the segment group from URLs like /app/... which are not routable
      {
        source: '/app',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/app/:path*',
        destination: '/:path*',
        permanent: false,
      },
      // Legacy or alias routes
      {
        source: '/classfinder',
        destination: '/activities',
        permanent: false,
      },
      {
        source: '/clases',
        destination: '/activities',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'padelsbarcelona.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.padelnuestro.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'padelnuestro.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

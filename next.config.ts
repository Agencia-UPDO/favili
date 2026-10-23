import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      '@': './src',
      '@public': './public',
    },
  },
  images: {
    qualities: [25, 50, 75, 100],
  },
  // Figuras das questões do vestibular: ficam fora de /public e só saem pela API da prova
  outputFileTracingIncludes: {
    '/api/vestibular/prova': ['./src/data/prova/img/**'],
  },
};

export default nextConfig;

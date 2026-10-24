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
  // Cabeçalhos de segurança do vestibular (dados pessoais): sem iframe de outros sites, sem adivinhar tipo de
  // arquivo, HTTPS obrigatório e endereço de origem só com o domínio. As áreas privadas também não são indexadas.
  async headers() {
    const seguranca = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ];
    const privado = [...seguranca, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      { source: '/vestibular/:path*', headers: seguranca },
      { source: '/vestibular/painel', headers: privado },
      { source: '/vestibular/minha-inscricao', headers: privado },
      { source: '/vestibular/prova', headers: privado },
      { source: '/api/vestibular/:path*', headers: [...privado, { key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;

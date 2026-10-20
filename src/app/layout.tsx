import SmoothScrollProvider from '@/components/shared/SmoothScroll';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { AppContextProvider } from '@/context/AppContext';
import { interTight, montserrat } from '@/utils/font';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import './globals.css';

// Endereço público do site: defina NEXT_PUBLIC_SITE_URL no deploy (a Vercel preenche sozinha).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3021');

const titulo = 'Empreend 2026 · Feira de Negócios | Faculdade Vidal';
const descricao =
  'Feira de Negócios Empreend 2026, 3ª edição: 18 de novembro, das 19h30 às 21h30, no pátio da Faculdade Vidal. Empresas locais, networking e música ao vivo com Carmen Júlia. Confirme sua presença.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: titulo,
  description: descricao,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Faculdade Vidal',
    title: 'Empreend 2026 · Feira de Negócios da Faculdade Vidal',
    description: descricao,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${interTight.variable} ${montserrat.variable} bg-white antialiased`}>
        <AppContextProvider>
          <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ThemeProvider>
        </AppContextProvider>
      </body>
    </html>
  );
}

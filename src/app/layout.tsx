import Provedores from '@/components/shared/Provedores';
import { interTight, montserrat } from '@/utils/font';
import { Metadata } from 'next';
import Script from 'next/script';
import { ReactNode } from 'react';
import './globals.css';

// Google Tag Manager da Faculdade Vidal
const GTM_ID = 'GTM-W6VKJFX6';

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
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        <Provedores>{children}</Provedores>
      </body>
    </html>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Páginas de campanha com tráfego pago (home do evento e vestibular) não carregam o código dos provedores do
// template: menos JavaScript no celular. As demais páginas continuam com tudo (carregado à parte).
const ProvedoresDoTemplate = dynamic(() => import('./ProvedoresDoTemplate'));

export const paginaDeCampanha = (pathname: string) => pathname === '/' || pathname.startsWith('/vestibular');

const Provedores = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  if (paginaDeCampanha(pathname)) {
    return children;
  }
  return <ProvedoresDoTemplate>{children}</ProvedoresDoTemplate>;
};

export default Provedores;

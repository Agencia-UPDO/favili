'use client';
import { ReactLenis, useLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

interface SmoothScrollingProps {
  children: ReactNode;
}

const SmoothScrollProvider = ({ children }: Readonly<SmoothScrollingProps>) => {
  // Sem useSearchParams: ele obrigava a página inteira a ser montada só no navegador
  const pathname = usePathname();
  const previousPathnameRef = useRef<string>(pathname);
  const isInitialRender = useRef(true);

  const lenis = useLenis();

  useEffect(() => {
    // Only scroll to top if pathname actually changed (navigation), not on initial render or reload
    if (!isInitialRender.current && previousPathnameRef.current !== pathname) {
      lenis?.scrollTo(0, { immediate: true });
    }

    // Update refs
    previousPathnameRef.current = pathname;
    isInitialRender.current = false;
  }, [pathname, lenis]);

  useEffect(() => {
    if (!lenis) {
      return;
    }

    const handleClick = (ele: Element) => {
      lenis.scrollTo(ele.getAttribute('href') ?? '', {
        offset: -100,
      });
    };

    const elements = document.querySelectorAll('.lenis-scroll-to');
    const clickHandler = (e: Event) => handleClick(e.target as Element);

    elements.forEach((ele) => {
      ele.addEventListener('click', clickHandler);
    });

    return () => {
      elements.forEach((ele) => {
        ele.removeEventListener('click', clickHandler);
      });
    };
  }, [lenis, pathname]);

  // Páginas de campanha (home do evento e vestibular): rolagem nativa do navegador, mais leve no celular e sem
  // atrapalhar o formulário e o teclado
  if (pathname === '/' || pathname.startsWith('/vestibular')) {
    return children;
  }

  return (
    <ReactLenis root options={{ duration: 1.1 }}>
      {children}
    </ReactLenis>
  );
};

export default SmoothScrollProvider;

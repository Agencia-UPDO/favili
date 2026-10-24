'use client';

import { cloneElement, ReactElement, Ref, useEffect, useRef } from 'react';

// Revelação leve, só com CSS (sem GSAP), para páginas de campanha com tráfego pago.
// O conteúdo vem pronto e visível do servidor: nada acima da dobra fica escondido esperando JavaScript.
// Só o que ainda está abaixo da tela ao carregar ganha um fade curto quando aparece, e quem pede menos movimento
// no sistema (prefers-reduced-motion) não vê animação nenhuma. Mesma assinatura do RevealAnimation, para trocar
// só o import.

type Props = {
  children: ReactElement<{ ref?: Ref<HTMLElement>; className?: string }>;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  // aceitos para compatibilidade com o RevealAnimation, sem efeito aqui
  duration?: number;
  offset?: number;
  instant?: boolean;
  className?: string;
};

const Revelar = ({ children, delay = 0, direction = 'down' }: Props) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    // Já visível ao carregar: fica como está
    if (el.getBoundingClientRect().top < window.innerHeight) {
      return;
    }
    el.dataset.revelar = direction;
    el.style.transitionDelay = `${Math.min(delay, 0.4)}s`;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.dataset.revelado = '';
          observador.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [delay, direction]);

  return cloneElement(children, { ref });
};

export default Revelar;

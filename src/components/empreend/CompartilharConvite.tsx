'use client';

import { evento } from '@/data/empreend';
import { cn } from '@/utils/cn';
import { useState } from 'react';

const nomeArquivo = 'eu-vou-empreend-2026.png';

// Compartilha a imagem "Eu vou no Empreend/" (gerada em /api/convite).
// No celular abre o menu de compartilhar (WhatsApp, Instagram…); no computador baixa a imagem
// e abre o WhatsApp Web com o convite.
const CompartilharConvite = ({ className }: { className?: string }) => {
  const [status, setStatus] = useState<'idle' | 'gerando'>('idle');

  const compartilhar = async () => {
    const texto = `Eu vou no Empreend 2026! Feira de Negócios da Faculdade Vidal: ${evento.data} (${evento.diaSemana}), das ${evento.horario}, no ${evento.local}. Confirme sua presença também: ${window.location.origin}`;
    setStatus('gerando');
    try {
      const blob = await (await fetch('/api/convite')).blob();
      const arquivo = new File([blob], nomeArquivo, { type: 'image/png' });

      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], text: texto });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      link.click();
      URL.revokeObjectURL(url);
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    } catch {
      // compartilhamento cancelado pela pessoa: nada a fazer
    } finally {
      setStatus('idle');
    }
  };

  return (
    <button
      type="button"
      onClick={compartilhar}
      disabled={status === 'gerando'}
      className={cn(
        'flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-center text-[14px] font-bold text-white transition-colors duration-300 hover:bg-[#1da851] disabled:opacity-60',
        className,
      )}>
      <svg aria-hidden width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.8Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z" />
      </svg>
      {status === 'gerando' ? 'Gerando imagem…' : 'Compartilhar'}
    </button>
  );
};

export default CompartilharConvite;

'use client';

import { perfis } from '@/data/empreend';
import { cn } from '@/utils/cn';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { formatPhone, inputClass, pillActive, pillClass } from './formStyles';

const acompanhantes = ['Só eu', '+1', '+2', '+3 ou mais'];

const InscricaoForm = ({ className }: { className?: string }) => {
  const [perfil, setPerfil] = useState(perfis[0]);
  const [companhia, setCompanhia] = useState(acompanhantes[0]);
  const [telefone, setTelefone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      nome: data.get('nome'),
      whatsapp: telefone,
      email: data.get('email'),
      perfil,
      acompanhantes: companhia,
      origem: 'empreend-2026',
    };
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.push('/obrigado');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'space-y-5 rounded-[28px] bg-white p-6 shadow-[0_30px_60px_-25px_rgba(1,20,64,0.6)] md:p-9',
        className,
      )}>
      <div className="space-y-1.5">
        <p className="font-letreiro text-secondary text-[26px] md:text-[30px]">Confirme sua presença</p>
        <p className="text-tagline-2 text-secondary/60">Entre na lista do Empreend e receba os avisos do evento.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="nome" className="text-tagline-2 text-secondary block font-medium">
          Nome completo
        </label>
        <input id="nome" name="nome" required autoComplete="name" placeholder="Seu nome" className={inputClass} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="whatsapp" className="text-tagline-2 text-secondary block font-medium">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="(88) 90000-0000"
            pattern="\(\d{2}\) \d{4,5}-\d{4}"
            value={telefone}
            onChange={(e) => setTelefone(formatPhone(e.target.value))}
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-tagline-2 text-secondary block font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="seu@email.com"
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-tagline-2 text-secondary mb-2 block font-medium">Você é</legend>
        <div className="flex flex-wrap gap-2">
          {perfis.map((p) => (
            <button
              type="button"
              key={p}
              aria-pressed={perfil === p}
              onClick={() => setPerfil(p)}
              className={cn(pillClass, 'min-w-[140px] px-4 whitespace-nowrap', perfil === p && pillActive)}>
              {p}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-tagline-2 text-secondary mb-2 block font-medium">Vai com mais alguém?</legend>
        <div className="flex gap-2">
          {acompanhantes.map((a) => (
            <button
              type="button"
              key={a}
              aria-pressed={companhia === a}
              onClick={() => setCompanhia(a)}
              className={cn(pillClass, 'px-2', companhia === a && pillActive)}>
              {a}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="text-tagline-3 text-secondary/60 flex cursor-pointer items-start gap-3">
        <input type="checkbox" required className="accent-emp-blue mt-0.5 size-4 shrink-0" />
        Autorizo a Faculdade Vidal a entrar em contato pelo WhatsApp e e-mail sobre o Empreend.
      </label>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-emp-cyan text-secondary hover:bg-emp-navy w-full cursor-pointer rounded-full px-8 py-4 text-lg font-extrabold transition-colors duration-300 hover:text-white disabled:opacity-60">
        {status === 'sending' ? 'Enviando…' : 'Quero participar'}
      </button>
      {status === 'error' && (
        <p className="text-tagline-2 text-center text-red-600">
          Não foi possível enviar agora. Tente novamente em instantes.
        </p>
      )}
    </form>
  );
};

export default InscricaoForm;

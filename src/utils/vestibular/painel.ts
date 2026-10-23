import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

// Acesso ao painel da faculdade: senha única em VESTIBULAR_PAINEL_SENHA (sem ela, o painel fica fechado).
// Depois de entrar, um cookie assinado vale por 12 horas.

const nomeCookie = 'vestibular_painel';
const validadeMs = 12 * 60 * 60 * 1000;

const senhaConfigurada = () => process.env.VESTIBULAR_PAINEL_SENHA ?? '';

const assinar = (expira: number) =>
  createHmac('sha256', senhaConfigurada()).update(`painel-vestibular:${expira}`).digest('hex');

const iguais = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const painelConfigurado = () => senhaConfigurada().length >= 8;

export const senhaCorreta = (senha: string) => painelConfigurado() && iguais(senha, senhaConfigurada());

export const abrirSessao = async () => {
  const expira = Date.now() + validadeMs;
  (await cookies()).set(nomeCookie, `${expira}.${assinar(expira)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: validadeMs / 1000,
  });
};

export const fecharSessao = async () => (await cookies()).delete(nomeCookie);

export const sessaoValida = async () => {
  if (!painelConfigurado()) {
    return false;
  }
  const valor = (await cookies()).get(nomeCookie)?.value ?? '';
  const [expira, assinatura] = valor.split('.');
  const quando = Number(expira);
  return !!assinatura && quando > Date.now() && iguais(assinatura, assinar(quando));
};

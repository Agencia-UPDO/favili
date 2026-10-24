import { instituicao, vestibular } from '@/data/vestibular';
import logo from '@public/images/vestibular/logo-vidal.png';
import { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

// Página não encontrada, na identidade da Faculdade Vidal (mesmas cores e retícula do vestibular), sem animação
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  weight: ['700', '800'],
});

export const metadata: Metadata = {
  title: 'Página não encontrada | Faculdade Vidal',
  robots: { index: false },
};

const caminhos = [
  { href: '/vestibular', titulo: 'Vestibular 2027.1', texto: 'Bolsas de até 100% e 40% para os aprovados' },
  {
    href: vestibular.inscricao,
    titulo: 'Inscreva-se no Vestibular Conquista Vidal',
    texto: 'Grátis, em poucos minutos',
  },
  { href: '/vestibular/minha-inscricao', titulo: 'Minha inscrição', texto: 'Entre com CPF e código' },
];

const NaoEncontrada = () => (
  <main className={`${barlowCondensed.variable} bg-background-3 min-h-screen px-3 py-6 md:px-5`}>
    <div className="bg-vest relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1200px] flex-col overflow-hidden rounded-[28px] md:rounded-[40px]">
      <div
        aria-hidden
        className="absolute inset-0 bg-white [mask-image:url(/images/vestibular/reticula.webp)] [mask-size:cover] [mask-position:center] opacity-[0.08]"
      />
      <header className="relative flex justify-center px-6 pt-8 md:justify-start md:px-12">
        <Link href="/vestibular" aria-label="Faculdade Vidal">
          <span className="inline-block rounded-2xl bg-white px-4 py-2">
            <Image src={logo} alt="Faculdade Vidal" className="h-9 w-auto md:h-11" priority />
          </span>
        </Link>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="font-chamada text-vest-cyan text-[96px] leading-none md:text-[160px]">404</p>
        <h1 className="font-chamada mt-3 max-w-[640px] text-[34px] text-white md:text-[48px]">Página não encontrada</h1>
        <p className="mt-4 max-w-[520px] text-[16px] text-white/85 md:text-[18px]">
          O endereço pode ter mudado ou estar digitado errado. Escolha um dos caminhos abaixo.
        </p>

        <ul className="mt-10 grid w-full max-w-[880px] gap-3 sm:grid-cols-3">
          {caminhos.map((c, i) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className={
                  i === 1
                    ? 'bg-vest-yellow text-vest-navy flex h-full flex-col rounded-2xl p-5 text-left transition-colors hover:bg-white'
                    : 'flex h-full flex-col rounded-2xl bg-white/10 p-5 text-left text-white ring-1 ring-white/25 transition-colors hover:bg-white/20'
                }>
                <span className="text-[17px] font-extrabold">{c.titulo} →</span>
                <span className={i === 1 ? 'text-vest-navy/80 mt-1 text-[14px]' : 'mt-1 text-[14px] text-white/75'}>
                  {c.texto}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-6 text-[15px] font-semibold text-white underline underline-offset-4">
          Ir para a página inicial
        </Link>
      </section>

      <footer className="relative px-6 pb-8 text-center text-[14px] text-white/70">
        Dúvidas? Fale com a Faculdade Vidal pelo{' '}
        <a href={instituicao.telefoneLink} className="font-semibold text-white underline-offset-4 hover:underline">
          {instituicao.telefone}
        </a>
      </footer>
    </div>
  </main>
);

export default NaoEncontrada;

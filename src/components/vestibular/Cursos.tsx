import { cursos, unidades } from '@/data/vestibular';
import { Rotulo } from './ui';

const grupos = [
  { titulo: 'Presenciais', descricao: 'Limoeiro do Norte', modalidades: ['Presencial'] },
  { titulo: 'EAD e semipresencial', descricao: unidades.join(' e '), modalidades: ['EAD', 'Semipresencial'] },
];

const Cursos = () => (
  <section id="cursos" className="bg-background-3 scroll-mt-20 py-16 md:py-20 lg:py-24" aria-labelledby="cursos-titulo">
    <div className="main-container space-y-10">
      <div className="mx-auto max-w-[760px] space-y-4 text-center">
        <Rotulo>Cursos 2027.1</Rotulo>
        <h2 id="cursos-titulo" className="font-chamada text-vest-navy">
          Escolha seu curso
        </h2>
        <p className="md:text-lg">
          Todos os cursos têm desconto garantido para quem entra em 2027.1, pelo vestibular ou não. A matrícula é de
          R$ 150,00 e, matriculando-se até 15/01/2027, a 1ª mensalidade também sai por R$ 150,00.
        </p>
      </div>

      {grupos.map((g) => (
        <div key={g.titulo} className="space-y-4">
          <p className="font-chamada text-vest-navy text-[26px]">
            {g.titulo} <span className="text-secondary/50 font-condensada text-[18px] normal-case">· {g.descricao}</span>
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cursos
              .filter((c) => g.modalidades.includes(c.modalidade))
              .map((c) => (
                <li key={`${c.nome}-${c.modalidade}`} className="flex flex-col rounded-[22px] bg-white p-5">
                  <span className="text-vest-blue text-[12px] font-bold tracking-[0.16em] uppercase">{c.modalidade}</span>
                  <span className="font-condensada text-vest-navy mt-1 text-[24px] leading-tight font-bold">{c.nome}</span>
                  <span className="text-tagline-2 text-secondary/60 mt-1">
                    {c.duracao} · {c.turno}
                  </span>
                  <span className="mt-4 flex flex-wrap gap-1.5 pt-1">
                    <span className="bg-primary-50 text-vest-navy rounded-full px-3 py-1 text-[12px] font-bold">
                      {c.desconto} garantido
                    </span>
                    {c.bolsaVestibular && (
                      <span className="bg-vest-yellow text-vest-navy rounded-full px-3 py-1 text-[12px] font-bold">
                        Bolsa no vestibular
                      </span>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default Cursos;

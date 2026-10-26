import { totalBolsas } from '@/data/bolsas';
import { bolsasResumo, degraus, regrasBolsa, vestibular } from '@/data/vestibular';
import { Check, Marca, Rotulo } from './ui';

const Bolsas = () => (
  <section id="bolsas" className="scroll-mt-20 py-16 md:py-20 lg:py-24" aria-labelledby="bolsas-titulo">
    <div className="main-container space-y-10 md:space-y-14">
      <div className="mx-auto max-w-[760px] space-y-4 text-center">
        <Rotulo>Descontos e bolsas</Rotulo>
        <h2 id="bolsas-titulo" className="font-chamada text-vest-navy">
          Todo mundo começa com <Marca>40%</Marca>. No vestibular, você vai além.
        </h2>
        <p className="md:text-lg">
          O desconto de 40% é garantido para todos os ingressantes 2027.1. Quem faz a prova de 21 ou 22 de novembro
          concorre a uma das {totalBolsas} bolsas, definidas pela classificação no curso, na modalidade e na unidade
          escolhidos na inscrição.
        </p>
      </div>

      {/* Escada: 40% para todos → bolsa do vestibular → 100% do 1º lugar */}
      <ol className="grid items-end gap-3 md:grid-cols-3">
        {degraus.map((d, i) => (
          <li
            key={d.titulo}
            className={
              i === 2
                ? 'bg-vest-yellow text-vest-navy rounded-[24px] p-6 md:min-h-[300px]'
                : i === 1
                  ? 'bg-vest rounded-[24px] p-6 text-white md:min-h-[250px]'
                  : 'bg-primary-50 text-vest-navy rounded-[24px] p-6 md:min-h-[200px]'
            }>
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase opacity-70">Degrau {i + 1}</span>
            <span className="font-chamada mt-1 block text-[48px] leading-none md:text-[56px]">{d.percentual}</span>
            <span className="mt-2 block text-[17px] font-bold">{d.titulo}</span>
            <span
              className={i === 1 ? 'text-tagline-2 mt-1 block text-white/80' : 'text-tagline-2 mt-1 block opacity-80'}>
              {d.texto}
            </span>
          </li>
        ))}
      </ol>

      <p className="font-chamada text-vest-navy text-center text-[26px] md:text-[30px]">
        As {totalBolsas} bolsas do vestibular
      </p>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {bolsasResumo.map((b, i) => (
          <li
            key={b.percentual}
            className={
              i === 0
                ? 'bg-vest-yellow text-vest-navy col-span-2 rounded-[22px] p-5 md:col-span-1'
                : 'bg-vest rounded-[22px] p-5 text-white'
            }>
            <span className="font-chamada block text-[52px] leading-none">{b.percentual}</span>
            <span className="mt-2 block text-[15px] font-bold">
              {b.quantidade} {b.quantidade === 1 ? 'bolsa' : 'bolsas'}
            </span>
            <span className={i === 0 ? 'text-tagline-2 text-vest-navy/80' : 'text-tagline-2 text-white/75'}>
              {b.texto}
            </span>
          </li>
        ))}
      </ul>

      <div className="bg-background-3 grid gap-6 rounded-[28px] p-6 md:grid-cols-[1fr_1.4fr] md:p-10">
        <div className="space-y-3">
          <p className="font-chamada text-vest-navy text-[28px]">Para manter sua bolsa</p>
          <p>
            Contemplados fazem a matrícula de {vestibular.matricula}, pagando {vestibular.taxaMatricula} (a bolsa de
            100% é isenta), e assinam o termo de aceite das regras.
          </p>
          <a
            href={vestibular.regulamento}
            target="_blank"
            className="text-vest-blue inline-flex items-center gap-2 font-bold underline-offset-4 hover:underline">
            Ler o regulamento completo (PDF)
          </a>
        </div>
        <ul className="space-y-3">
          {regrasBolsa.map((r) => (
            <li key={r} className="text-secondary/80 flex gap-3 text-[15px] leading-snug">
              <Check className="text-vest-blue mt-0.5 size-4 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </section>
);

export default Bolsas;

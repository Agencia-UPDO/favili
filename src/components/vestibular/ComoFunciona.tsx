import { cronograma, prova, vestibular } from '@/data/vestibular';
import aluno from '@public/images/vestibular/aluno-mochila.jpg';
import Image from 'next/image';
import { BotaoInscricao, Rotulo } from './ui';

const ComoFunciona = () => (
  <section
    id="como-funciona"
    className="bg-background-3 scroll-mt-20 py-16 md:py-20 lg:py-24"
    aria-labelledby="como-titulo">
    <div className="main-container space-y-10 md:space-y-14">
      <div className="grid grid-cols-12 items-end gap-6">
        <div className="col-span-12 space-y-4 text-center lg:col-span-7 lg:text-left">
          <Rotulo>Vestibular Conquista Vidal</Rotulo>
          <h2 id="como-titulo" className="font-chamada text-vest-navy">
            Como funciona a prova on-line
          </h2>
          <p className="mx-auto max-w-[600px] md:text-lg lg:mx-0">
            Você faz a prova de onde estiver, no dia e no horário que preferir, com o login e a senha que chegam no seu
            e-mail. A inscrição é gratuita e o resultado sai em poucos dias.
          </p>
        </div>
        <div className="col-span-12 flex justify-center lg:col-span-5 lg:justify-end">
          <BotaoInscricao />
        </div>
      </div>

      {/* Passo a passo com as datas do cronograma oficial */}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cronograma.map((c, i) => (
          <li className="relative h-full overflow-hidden rounded-[22px] bg-white p-5">
            <span className="font-chamada text-primary-100 absolute -top-1 right-3 text-[56px]">{i + 1}</span>
            <span className="font-chamada text-vest-blue relative block pr-8 text-[26px]">{c.data}</span>
            <span className="text-vest-navy relative mt-1 block text-[16px] font-bold">{c.etapa}</span>
            <span className="text-tagline-2 text-secondary/60 relative mt-1 block">{c.extra}</span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-12 gap-5 lg:gap-8">
        {/* Composição da prova */}
        <div className="bg-vest relative col-span-12 overflow-hidden rounded-[28px] p-6 text-white md:p-8">
          <div className="relative grid gap-6 md:grid-cols-[1fr_260px] md:items-center">
            <div className="space-y-5">
              <p className="font-chamada text-[26px] text-white">O que cai na prova</p>
              <p className="font-chamada text-[64px] leading-none text-white md:text-[80px]">
                {prova.questoes} <span className="text-vest-cyan text-[32px] md:text-[40px]">questões objetivas</span>
              </p>
              <div className="flex h-3 overflow-hidden rounded-full">
                <span className="bg-vest-yellow w-1/2" />
                <span className="bg-vest-cyan w-1/2" />
              </div>
              <ul className="grid grid-cols-2 gap-3">
                {prova.areas.map((a, i) => (
                  <li key={a.nome} className="rounded-2xl bg-white/10 p-4">
                    <span
                      className={`font-chamada block text-[34px] ${i === 0 ? 'text-vest-yellow' : 'text-vest-cyan'}`}>
                      {a.questoes}
                    </span>
                    <span className="text-[15px] font-semibold">{a.nome}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-1.5 text-[15px] text-white/85">
                <li>
                  Cada questão vale {prova.valorQuestao}: nota máxima {prova.notaMaxima}.
                </li>
                <li>{vestibular.duracaoHoras} horas a partir do horário escolhido (quem atrasa perde o atraso).</li>
                <li>Uma única tentativa, sem segunda chamada.</li>
              </ul>
            </div>
            <Image
              src={aluno}
              alt="Estudante da Faculdade Vidal com mochila"
              sizes="260px"
              className="hidden h-auto w-full rounded-[20px] md:block"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ComoFunciona;

import apresentacao from '@public/images/empreend/fotos/apresentacao.jpg';
import atendimento from '@public/images/empreend/fotos/atendimento.jpg';
import conversaEstande from '@public/images/empreend/fotos/conversa-estande.jpg';
import conversa from '@public/images/empreend/fotos/conversa.jpg';
import degustacao from '@public/images/empreend/fotos/degustacao.jpg';
import drinks from '@public/images/empreend/fotos/drinks.jpg';
import cookies from '@public/images/empreend/fotos/fabrica-de-cookies.jpg';
import publico from '@public/images/empreend/fotos/publico.jpg';
import risadas from '@public/images/empreend/fotos/risadas.jpg';
import rodaDeConversa from '@public/images/empreend/fotos/roda-de-conversa.jpg';
import Image, { StaticImageData } from 'next/image';
import RevealAnimation from '../animation/Revelar';
import Kicker from './Kicker';

// Mosaico de 16 células (4 colunas × 4 linhas no computador); grid-flow-dense encaixa as peças
const fotos: { src: StaticImageData; alt: string; className: string }[] = [
  { src: publico, alt: 'Pátio da Faculdade Vidal lotado durante o Empreend 2025', className: 'col-span-2 row-span-2' },
  { src: degustacao, alt: 'Expositora oferecendo degustação a um visitante', className: 'row-span-2' },
  { src: cookies, alt: 'Equipe da Fábrica de Cookies no estande', className: '' },
  { src: risadas, alt: 'Visitantes rindo durante a conversa em um estande', className: '' },
  { src: rodaDeConversa, alt: 'Roda de conversa entre visitantes e expositores', className: 'col-span-2' },
  { src: atendimento, alt: 'Atendimento a uma cliente no estande', className: 'row-span-2' },
  { src: conversa, alt: 'Visitantes conversando entre os estandes', className: '' },
  { src: conversaEstande, alt: 'Expositoras conversando com o público', className: '' },
  { src: drinks, alt: 'Estande de drinks na feira', className: '' },
  { src: apresentacao, alt: 'Expositora apresentando os produtos aos visitantes', className: '' },
];

const Galeria = () => {
  return (
    <section className="py-16 md:py-20 lg:py-[110px]" aria-label="Como foi a edição 2025">
      <div className="main-container space-y-10 md:space-y-14">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="space-y-4">
            <RevealAnimation delay={0.2}>
              <Kicker>Edição 2025</Kicker>
            </RevealAnimation>
            <RevealAnimation delay={0.3}>
              <h2 className="font-letreiro max-w-[560px]">
                Olha como foi <span className="text-emp-blue">o último Empreend</span>
              </h2>
            </RevealAnimation>
          </div>
          <RevealAnimation delay={0.4}>
            <p className="max-w-[380px]">Estandes cheios, muita conversa boa e negócio acontecendo no pátio.</p>
          </RevealAnimation>
        </div>

        <RevealAnimation delay={0.3}>
          <div className="grid grid-flow-dense auto-rows-[140px] grid-cols-2 gap-3 md:auto-rows-[200px] md:grid-cols-4 md:gap-4">
            {fotos.map((f) => (
              <figure key={f.alt} className={`relative overflow-hidden rounded-[22px] ${f.className}`}>
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  placeholder="blur"
                />
              </figure>
            ))}
          </div>
        </RevealAnimation>
      </div>
    </section>
  );
};

export default Galeria;

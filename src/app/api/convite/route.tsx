import { evento, lembretes } from '@/data/empreend';
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Imagem "Eu vou no Empreend/" (1080×1350, retrato) para compartilhar no WhatsApp e nas redes.
// Gerada no build; o bloco de notas repete o visual do BlocoAgenda da página de obrigado.
export const dynamic = 'force-static';

const navy = '#021f5c';
const azul = '#1357d9';
const ciano = '#00cfff';
const pauta = 'rgba(19, 87, 217, 0.16)';

const fonte = (pkg: string, arquivo: string) =>
  readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', arquivo));

const Linha = ({ children, altura = 66 }: { children?: React.ReactNode; altura?: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      height: altura,
      paddingLeft: 40,
      borderBottom: `2px solid ${pauta}`,
    }}>
    {children}
  </div>
);

const Rotulo = ({ children }: { children: string }) => (
  <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 22, letterSpacing: 6, color: azul }}>
    {children}
  </span>
);

export async function GET() {
  const [m900, m700, i500, i600, faixa] = await Promise.all([
    fonte('montserrat', 'montserrat-latin-900-normal.woff'),
    fonte('montserrat', 'montserrat-latin-700-normal.woff'),
    fonte('inter-tight', 'inter-tight-latin-500-normal.woff'),
    fonte('inter-tight', 'inter-tight-latin-600-normal.woff'),
    readFile(join(process.cwd(), 'public/images/empreend/logo-faixa.png'), 'base64'),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          backgroundImage: 'linear-gradient(160deg, #0533a0 0%, #021f5c 55%, #011440 100%)',
          fontFamily: 'Inter Tight',
        }}>
        {/* linhas de crescimento ao fundo */}
        <svg
          width="1080"
          height="1350"
          viewBox="0 0 1080 1350"
          style={{ position: 'absolute', top: 0, left: 0 }}
          fill="none">
          <path
            d="M-20 1180 L140 1100 L260 1140 L400 980 L520 1030 L680 860 L800 900 L1000 640"
            stroke={ciano}
            strokeOpacity={0.22}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path d="M1000 640 L955 646 M1000 640 L984 683" stroke={ciano} strokeOpacity={0.22} strokeWidth={5} strokeLinecap="round" />
          <path
            d="M-20 1290 L160 1230 L300 1260 L460 1120 L600 1150 L760 1000 L900 1030 L1100 820"
            stroke="#ffffff"
            strokeOpacity={0.06}
            strokeWidth={3}
          />
          {[80, 200, 320, 840, 960].map((x, i) => (
            <rect key={x} x={x} y={1350 - [110, 170, 140, 200, 280][i]} width="70" height={[110, 170, 140, 200, 280][i]} fill={azul} fillOpacity={0.14} />
          ))}
        </svg>

        <img src={`data:image/png;base64,${faixa}`} width={520} height={112} style={{ marginTop: 70, objectFit: 'contain' }} />

        <div
          style={{
            display: 'flex',
            marginTop: 34,
            fontFamily: 'Montserrat',
            fontWeight: 900,
            fontSize: 92,
            color: '#ffffff',
            letterSpacing: -2,
          }}>
          EU VOU<span style={{ color: ciano }}>!</span>
        </div>

        {/* bloco de notas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 820,
            marginTop: 36,
            transform: 'rotate(-2deg)',
            position: 'relative',
          }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              borderRadius: '10px 10px 28px 28px',
              boxShadow: '0 40px 80px -30px rgba(0,0,0,0.7)',
              position: 'relative',
              paddingBottom: 26,
            }}>
            {/* furos da espiral */}
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '22px 40px 8px' }}>
              {Array.from({ length: 13 }, (_, i) => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: navy }} />
              ))}
            </div>
            {/* margem */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 30, width: 2, backgroundColor: 'rgba(0,207,255,0.5)' }} />

            <Linha>
              <Rotulo>ANOTE NA AGENDA</Rotulo>
            </Linha>
            <Linha altura={92}>
              <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: -10,
                    right: -10,
                    bottom: 8,
                    height: 30,
                    backgroundColor: 'rgba(0,207,255,0.45)',
                    transform: 'skewX(-12deg)',
                  }}
                />
                <span style={{ fontFamily: 'Montserrat', fontWeight: 900, fontSize: 64, color: navy }}>18/11</span>
              </div>
              <span style={{ marginLeft: 22, fontWeight: 600, fontSize: 32, color: navy }}>{evento.diaSemana}</span>
            </Linha>
            <Linha>
              <span style={{ fontWeight: 600, fontSize: 32, color: navy }}>{evento.horario}</span>
            </Linha>
            <Linha>
              <span style={{ fontWeight: 500, fontSize: 30, color: 'rgba(2,31,92,0.72)' }}>{evento.local}</span>
            </Linha>
            <Linha />
            <Linha>
              <Rotulo>NÃO ESQUECER</Rotulo>
            </Linha>
            {lembretes.map((l) => (
              <Linha key={l}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style={{ marginRight: 16 }}>
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke={azul} strokeOpacity={0.35} strokeWidth="1.6" />
                  <path d="M6.5 12.5 10.5 16.5 18 7" stroke={azul} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontWeight: 500, fontSize: 28, color: 'rgba(2,31,92,0.82)' }}>{l}</span>
              </Linha>
            ))}
          </div>
          {/* post-it */}
          <div
            style={{
              position: 'absolute',
              top: -34,
              right: -26,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: ciano,
              color: navy,
              padding: '18px 24px',
              transform: 'rotate(6deg)',
              fontFamily: 'Montserrat',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: 4,
              lineHeight: 1.3,
              boxShadow: '0 14px 24px -12px rgba(0,0,0,0.5)',
            }}>
            <span>3ª EDIÇÃO</span>
            <span>NÃO PERCA!</span>
          </div>

        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: 'auto',
            marginBottom: 64,
            color: '#ffffff',
          }}>
          <span style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 22, letterSpacing: 7, color: ciano }}>
            VEM COMIGO?
          </span>
          <span style={{ marginTop: 10, fontWeight: 500, fontSize: 26, color: 'rgba(255,255,255,0.75)' }}>
            Confirme sua presença no site do Empreend
          </span>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: 'Montserrat', data: m900, weight: 900, style: 'normal' },
        { name: 'Montserrat', data: m700, weight: 700, style: 'normal' },
        { name: 'Inter Tight', data: i500, weight: 500, style: 'normal' },
        { name: 'Inter Tight', data: i600, weight: 600, style: 'normal' },
      ],
    },
  );
}

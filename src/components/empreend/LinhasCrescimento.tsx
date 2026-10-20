import { cn } from '@/utils/cn';

// Fundo de "linhas de crescimento": gráficos de linha subindo, a principal terminando na seta do logo do Empreend.
// tom="escuro" para fundos marinho (linhas ciano/brancas) e tom="claro" para fundos claros (linhas azuis).

// linha principal: termina na ponta da seta (sem continuação depois do último pico)
const principal = 'M-20 520 L120 470 L220 495 L340 400 L450 430 L580 310 L700 345 L840 210 L960 240 L1150 85';
const secundarias = [
  'M-20 600 L140 560 L260 580 L380 500 L500 520 L640 420 L760 450 L900 330 L1020 360 L1160 240 L1240 255',
  'M-20 420 L100 400 L230 410 L330 340 L470 360 L590 260 L720 285 L850 170 L980 190 L1120 70 L1240 90',
];

// barras do gráfico do logo, no rodapé do fundo
const barras = [
  { x: 60, h: 70 },
  { x: 150, h: 110 },
  { x: 240, h: 90 },
  { x: 330, h: 150 },
  { x: 900, h: 120 },
  { x: 990, h: 180 },
  { x: 1080, h: 150 },
  { x: 1170, h: 230 },
];

const LinhasCrescimento = ({ tom = 'escuro', className }: { tom?: 'escuro' | 'claro'; className?: string }) => {
  const escuro = tom === 'escuro';
  const traco = escuro ? '#00cfff' : '#1357d9';
  const fraco = escuro ? '#ffffff' : '#021f5c';
  const opPrincipal = escuro ? 0.2 : 0.13;

  return (
    <svg
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none">
      {/* guias horizontais do gráfico */}
      {[160, 280, 400, 520].map((y) => (
        <line
          key={y}
          x1="0"
          x2="1200"
          y1={y}
          y2={y}
          stroke={fraco}
          strokeOpacity={escuro ? 0.04 : 0.035}
          strokeDasharray="4 10"
        />
      ))}

      {barras.map((b) => (
        <rect key={b.x} x={b.x} y={640 - b.h} width="46" height={b.h} fill="#1357d9" fillOpacity={escuro ? 0.1 : 0.04} />
      ))}

      {secundarias.map((d) => (
        <path
          key={d}
          d={d}
          stroke={fraco}
          strokeOpacity={escuro ? 0.05 : 0.04}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}

      <path
        d={principal}
        stroke={traco}
        strokeOpacity={opPrincipal}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* pontos nos picos intermediários */}
      {[
        [340, 400],
        [580, 310],
        [840, 210],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="5" fill={traco} fillOpacity={escuro ? 0.3 : 0.18} />
      ))}

      {/* ponta da seta, alinhada à direção do último trecho */}
      <path
        d="M1150 85 L1118.4 90.1 M1150 85 L1138.6 114.9"
        stroke={traco}
        strokeOpacity={opPrincipal}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LinhasCrescimento;

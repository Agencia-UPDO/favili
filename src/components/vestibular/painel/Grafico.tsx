'use client';

import type { EChartsCoreOption } from 'echarts/core';
import { useEffect, useRef } from 'react';

// Gráfico do painel com Apache ECharts. A biblioteca só é baixada quando o gráfico aparece (import dinâmico no
// navegador), então não pesa no site público nem roda no servidor.

const carregar = async () => {
  const [echarts, { BarChart }, componentes, { CanvasRenderer }] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ]);
  echarts.use([
    BarChart,
    componentes.GridComponent,
    componentes.TooltipComponent,
    componentes.LegendComponent,
    componentes.MarkLineComponent,
    CanvasRenderer,
  ]);
  return echarts;
};

const Grafico = ({ opcao, altura, rotulo }: { opcao: EChartsCoreOption; altura: number; rotulo: string }) => {
  const caixa = useRef<HTMLDivElement>(null);
  // Opção mais recente: vale também quando o filtro muda antes de a biblioteca terminar de carregar
  const ultima = useRef(opcao);
  const grafico = useRef<{ setOption: (o: EChartsCoreOption, naoJuntar?: boolean) => void } | null>(null);

  useEffect(() => {
    let vivo = true;
    let desfazer = () => {};
    carregar().then((echarts) => {
      if (!vivo || !caixa.current) {
        return;
      }
      const g = echarts.init(caixa.current, null, { renderer: 'canvas' });
      grafico.current = g;
      g.setOption(ultima.current, true);
      // Redimensiona com a janela e com a caixa (abrir/fechar abas, girar o celular)
      const observador = new ResizeObserver(() => g.resize());
      observador.observe(caixa.current);
      desfazer = () => {
        observador.disconnect();
        g.dispose();
        grafico.current = null;
      };
    });
    return () => {
      vivo = false;
      desfazer();
    };
  }, []);

  useEffect(() => {
    ultima.current = opcao;
    grafico.current?.setOption(opcao, true);
  }, [opcao]);

  return <div ref={caixa} role="img" aria-label={rotulo} style={{ height: altura }} className="w-full" />;
};

export default Grafico;

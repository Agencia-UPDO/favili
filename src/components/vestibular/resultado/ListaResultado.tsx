'use client';

import { soDigitos } from '@/utils/vestibular/validacao';
import { useState } from 'react';

// Lista pública dos contemplados, por curso, com busca pelo número de inscrição (regulamento, Art. 20)

export type LinhaPublica = {
  numero: number;
  iniciais: string;
  ofertaId: string;
  oferta: string;
  classificacaoOferta: number;
  bolsa: number;
};

const ListaResultado = ({ grupos }: { grupos: { oferta: string; linhas: LinhaPublica[] }[] }) => {
  const [busca, setBusca] = useState('');
  const numero = soDigitos(busca);
  const achado = numero.length >= 6 ? grupos.flatMap((g) => g.linhas).find((l) => String(l.numero) === numero) : null;

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-[24px] bg-white p-5 md:p-6">
        <label htmlFor="busca" className="text-vest-navy block font-bold">
          Consulte pelo número de inscrição
        </label>
        <input
          id="busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          inputMode="numeric"
          placeholder="Ex.: 2027100123"
          className="border-stroke-3 focus:border-vest-blue h-12 w-full rounded-2xl border px-4 text-[16px] focus:outline-none"
        />
        {numero.length >= 6 && (
          <p className="text-[15px]">
            {achado ? (
              <>
                <strong className="text-vest-blue">Inscrição {achado.numero}:</strong> {achado.classificacaoOferta}º
                lugar em {achado.oferta}, com bolsa de <strong>{achado.bolsa}%</strong>.
              </>
            ) : (
              'Esse número não está entre os contemplados com bolsa. Todos os aprovados têm 40% de desconto garantido; veja os detalhes em Minha inscrição.'
            )}
          </p>
        )}
      </div>

      {grupos.map((g) => (
        <section key={g.oferta} className="space-y-3">
          <h2 className="font-chamada text-vest-navy text-[26px]">{g.oferta}</h2>
          <div className="overflow-hidden rounded-[20px] bg-white">
            <table className="w-full text-left text-[15px]">
              <thead className="text-secondary/60 border-stroke-2 border-b text-[13px]">
                <tr>
                  <th className="px-4 py-2 font-semibold">Classificação</th>
                  <th className="px-4 py-2 font-semibold">Nº de inscrição</th>
                  <th className="px-4 py-2 font-semibold">Candidato</th>
                  <th className="px-4 py-2 font-semibold">Bolsa</th>
                </tr>
              </thead>
              <tbody>
                {g.linhas.map((l) => (
                  <tr key={l.numero} className="border-stroke-2 border-b last:border-0">
                    <td className="px-4 py-2.5 font-semibold">{l.classificacaoOferta}º</td>
                    <td className="px-4 py-2.5">{l.numero}</td>
                    <td className="px-4 py-2.5">{l.iniciais}</td>
                    <td className="text-vest-blue px-4 py-2.5 font-bold">{l.bolsa}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
};

export default ListaResultado;

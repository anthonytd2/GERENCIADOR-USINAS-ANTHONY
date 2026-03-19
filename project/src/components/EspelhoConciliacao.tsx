import React from "react";
import { Printer, X, Wallet } from "lucide-react";

// 🟢 Mantemos a interface para o TypeScript ficar feliz
export interface Transacao {
  id?: number;
  tipo: string;
  categoria?: string;
  valor: string | number;
  data_operacao: string;
  descricao: string;
  pessoa?: string;
  codigo_conciliacao?: string;
  conta?: string;
  status?: string;
  observacoes?: string;
  conciliado?: boolean;
  saldo_momento_0?: number;
  saldo_momento_6?: number;
}

interface EspelhoConciliacaoProps {
  dados: Transacao[];
  onClose: () => void;
}

export default function EspelhoConciliacao({
  dados,
  onClose,
}: EspelhoConciliacaoProps) {
  const formatarMoeda = (valor: number | string) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor));

  const entradas = dados.filter(
    (t) => t.tipo === "ENTRADA" && t.categoria !== "LUCRO / SPREAD",
  );
  const saidas = dados.filter(
    (t) => t.tipo === "SAIDA" && t.categoria !== "LUCRO / SPREAD",
  );
  const spread = dados.find((t) => t.categoria === "LUCRO / SPREAD");

  const totalEntradas = entradas.reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = saidas.reduce((acc, t) => acc + Number(t.valor), 0);
  const valorSpread = spread ? Number(spread.valor) : 0;

  const codigo = dados[0]?.codigo_conciliacao || "N/A";
  const dataEmissao = new Date().toLocaleDateString("pt-BR");

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/80 flex justify-center overflow-y-auto print:bg-white print:static print:block backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-3xl min-h-screen p-8 md:p-12 print:m-0 print:p-0 print:shadow-none shadow-2xl relative">
        {/* BOTÕES (Não aparecem na impressão) */}
        <div className="print:hidden absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <X size={16} /> Fechar
          </button>
        </div>

        {/* CABEÇALHO SIMPLIFICADO */}
        <div className="border-b-2 border-gray-800 pb-4 mb-8 mt-8 print:mt-0 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 mb-1">
              <Wallet className="text-gray-900" size={24} /> Solar Locações
            </h1>
            <h2 className="text-md font-bold text-gray-500 uppercase tracking-widest">
              Espelho de Conciliação
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Ref: {codigo}
            </p>
            <p className="text-xs text-gray-500">Data: {dataEmissao}</p>
          </div>
        </div>

        {/* 1. ORIGEM (RECEBIMENTOS) */}
        {entradas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase">
              1. Origem (Recebimentos)
            </h3>
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 text-[10px] uppercase">
                <tr>
                  <th className="pb-2 w-24">Data</th>
                  <th className="pb-2">Descrição / Cliente</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entradas.map((t) => (
                  <tr key={t.id} className="text-gray-800">
                    <td className="py-2 font-mono text-xs">
                      {new Date(
                        t.data_operacao + "T12:00:00Z",
                      ).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 font-semibold">
                      {t.descricao}{" "}
                      {t.pessoa && (
                        <span className="font-normal text-gray-500">
                          ({t.pessoa})
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs">{t.categoria}</td>
                    <td className="py-2 text-right font-bold">
                      {formatarMoeda(t.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. DESTINAÇÃO (REPASSES E CUSTOS) */}
        {saidas.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3 uppercase">
              2. Destinação (Repasses e Custos)
            </h3>
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 text-[10px] uppercase">
                <tr>
                  <th className="pb-2 w-24">Data</th>
                  <th className="pb-2">Descrição / Fornecedor</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {saidas.map((t) => (
                  <tr key={t.id} className="text-gray-800">
                    <td className="py-2 font-mono text-xs">
                      {new Date(
                        t.data_operacao + "T12:00:00Z",
                      ).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-2 font-semibold">
                      {t.descricao}{" "}
                      {t.pessoa && (
                        <span className="font-normal text-gray-500">
                          ({t.pessoa})
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-xs">{t.categoria}</td>
                    <td className="py-2 text-right font-bold text-gray-600">
                      - {formatarMoeda(t.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESUMO TOTAL (ENTRADA, SAÍDA E SPREAD) */}
        <div className="mt-12 border-t-2 border-gray-800 pt-6">
          <div className="w-full md:w-1/2 ml-auto space-y-2 text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span className="uppercase font-bold">Total de Entradas:</span>
              <span className="font-bold">{formatarMoeda(totalEntradas)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-b border-gray-200 pb-3">
              <span className="uppercase font-bold">Total de Saídas:</span>
              <span className="font-bold">- {formatarMoeda(totalSaidas)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="uppercase font-black text-lg text-gray-900">
                Spread (Lucro):
              </span>
              <span className="font-black text-xl text-gray-900">
                {formatarMoeda(valorSpread)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

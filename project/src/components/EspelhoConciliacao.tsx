import React from "react";
import {
  Printer,
  X,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
} from "lucide-react";

// 🟢 Essa é a identidade da transação, ajuda o TypeScript a parar de reclamar
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
  // 🟢 Convertendo explicitamente para Number para o TypeScript aceitar
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

  const codigo = dados[0]?.codigo_conciliacao || "N/A";
  const dataEmissao = new Date().toLocaleString("pt-BR");

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/80 flex justify-center overflow-y-auto print:bg-white print:static print:block backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full max-w-4xl min-h-screen p-8 md:p-12 print:m-0 print:p-0 print:shadow-none shadow-2xl relative animate-fade-in-down rounded-xl print:rounded-none">
        {/* BOTÕES DE AÇÃO (Ocultos na impressão) */}
        <div className="print:hidden absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <Printer size={18} /> Imprimir / PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all"
          >
            <X size={18} /> Fechar
          </button>
        </div>

        {/* CABEÇALHO */}
        <div className="border-b-2 border-gray-100 pb-6 mb-8 mt-8 print:mt-0 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="text-white" size={24} />
              </div>
              Solar Locações
            </h1>
            <h2 className="text-lg font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={18} className="text-purple-500" />
              Espelho de Conciliação
            </h2>
          </div>
          <div className="text-left md:text-right bg-gray-50 p-3 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Código da Operação
            </p>
            <p className="font-mono text-sm font-bold text-gray-800">
              {codigo}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Gerado em: {dataEmissao}
            </p>
          </div>
        </div>

        {/* CARDS DE RESUMO VISUAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
            <p className="text-xs font-bold text-green-600 uppercase mb-1">
              Total Recebido
            </p>
            <p className="text-2xl font-black text-green-700">
              {formatarMoeda(totalEntradas)}
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">
              Total Repassado / Custo
            </p>
            <p className="text-2xl font-black text-red-700">
              - {formatarMoeda(totalSaidas)}
            </p>
          </div>
          <div className="bg-blue-600 shadow-lg shadow-blue-200 p-4 rounded-xl text-white transform md:scale-105">
            <p className="text-xs font-bold text-blue-200 uppercase mb-1">
              Lucro Líquido (Spread)
            </p>
            <p className="text-3xl font-black">
              {spread ? formatarMoeda(Number(spread.valor)) : "R$ 0,00"}
            </p>
          </div>
        </div>

        {/* DETALHAMENTO DA OPERAÇÃO */}
        <div className="space-y-8">
          {/* Entradas */}
          {entradas.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b-2 border-gray-800 pb-2 mb-4 uppercase tracking-wider">
                <ArrowUpCircle size={18} className="text-green-500" /> 1. Origem
                (Recebimentos)
              </h3>
              <table className="w-full text-sm">
                <thead className="text-left text-gray-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="pb-2 w-24">Data</th>
                    <th className="pb-2">Descrição / Cliente</th>
                    <th className="pb-2">Categoria</th>
                    <th className="pb-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entradas.map((t) => (
                    <tr key={t.id} className="text-gray-600">
                      <td className="py-3 font-mono text-xs">
                        {new Date(
                          t.data_operacao + "T12:00:00Z",
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 font-bold text-gray-800">
                        {t.descricao}{" "}
                        {t.pessoa && (
                          <span className="text-gray-400 font-normal">
                            ({t.pessoa})
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs">{t.categoria}</td>
                      <td className="py-3 text-right font-black text-green-600">
                        {formatarMoeda(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Saídas */}
          {saidas.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b-2 border-gray-800 pb-2 mb-4 uppercase tracking-wider">
                <ArrowDownCircle size={18} className="text-red-500" /> 2.
                Destinação (Repasses e Custos)
              </h3>
              <table className="w-full text-sm">
                <thead className="text-left text-gray-400 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="pb-2 w-24">Data</th>
                    <th className="pb-2">Descrição / Fornecedor</th>
                    <th className="pb-2">Categoria</th>
                    <th className="pb-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {saidas.map((t) => (
                    <tr key={t.id} className="text-gray-600">
                      <td className="py-3 font-mono text-xs">
                        {new Date(
                          t.data_operacao + "T12:00:00Z",
                        ).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 font-bold text-gray-800">
                        {t.descricao}{" "}
                        {t.pessoa && (
                          <span className="text-gray-400 font-normal">
                            ({t.pessoa})
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs">{t.categoria}</td>
                      <td className="py-3 text-right font-black text-red-600">
                        - {formatarMoeda(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé e Assinatura */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-medium gap-4">
              <p className="text-center md:text-left max-w-md">
                Documento gerado eletronicamente pelo módulo financeiro da Solar
                Locações. A integridade contábil está vinculada ao código da
                operação no Livro Razão.
              </p>
              <div className="w-48 border-t border-gray-400 pt-2 text-center mt-4 md:mt-0">
                <p className="font-bold text-gray-600 uppercase">
                  Conferido por
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

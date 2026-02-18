import { Zap, Globe, Phone } from 'lucide-react';

interface PropostaPDFProps {
  form: any;
  resultado: any;
}

export function PropostaPDF({ form, resultado }: PropostaPDFProps) {
  if (!resultado) return null;

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtP = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v || 0) + '%';

  return (
    <div className="w-[210mm] bg-gray-50-card text-gray-900 font-sans">
      
      {/* --- PÁGINA 1: CAPA (MANTIDA IGUAL - SEM BUGS) --- */}
      <div className="h-[297mm] bg-slate-900 text-white p-14 flex flex-col justify-between relative page-break-after">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-800 skew-x-12 translate-x-24 z-0"></div>

          <div className="z-10 relative mt-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-emerald-500 p-3 rounded-lg">
                <Zap className="w-12 h-12 text-white" fill="currentColor" />
              </div>
              <span className="text-6xl font-bold tracking-wider">BIONOVA</span>
            </div>
            <div className="h-2 w-32 bg-emerald-500 rounded-full"></div>
          </div>

          <div className="z-10 relative">
            <p className="text-emerald-400 font-bold text-2xl mb-4 uppercase tracking-widest">Estudo de Viabilidade</p>
            <h1 className="text-8xl font-black leading-none mb-8 tracking-tight">
              Energia <br/> 
              <span className="text-slate-400">por Assinatura</span>
            </h1>
            <p className="text-2xl text-slate-300 max-w-xl leading-relaxed border-l-4 border-emerald-500 pl-6">
              A forma mais inteligente de reduzir seus custos. Sem investimento, sem obras e com economia garantida.
            </p>
          </div>

          <div className="z-10 relative bg-slate-800 p-10 rounded-xl border-l-8 border-emerald-500 shadow-2xl">
              <p className="text-sm text-slate-400 uppercase mb-3 font-bold tracking-wider">Preparado para:</p>
              <h2 className="text-5xl font-black text-white mb-8 leading-tight uppercase">
                {form.nome}
              </h2>
              
              <div className="flex justify-between items-end border-t border-slate-600 pt-6">
                <div>
                  <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Unidade Consumidora</p>
                  <p className="text-3xl font-mono text-white">{form.uc || '---'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Data da Emissão</p>
                  <p className="text-3xl font-mono text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
          </div>
      </div>

      {/* --- PÁGINA 2: ANÁLISE E TÉCNICA --- */}
      <div className="h-[297mm] px-10 py-10 flex flex-col relative bg-gray-50-card">
          
          {/* Cabeçalho */}
          <div className="flex justify-between items-end mb-6 border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase">Análise Financeira</h2>
              <p className="text-sm text-slate-500">Resumo do seu potencial de economia.</p>
            </div>
            <div className="text-right">
               <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full uppercase">Validade: 10 Dias</span>
            </div>
          </div>

          {/* CARDS (TAMANHO MÉDIO - CALIBRADO) */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {/* Card 1 */}
            <div className="bg-gray-50-card p-5 rounded-lg shadow-sm border-2 border-emerald-50 flex flex-col justify-between h-36">
              <p className="text-emerald-700 font-bold uppercase text-xs tracking-wider">Economia Mensal</p>
              <div className="text-emerald-600 font-black text-4xl tracking-tight">{fmt(resultado.economiaRealCliente)}</div>
              <p className="text-xs text-gray-500 ">Livre no seu bolso</p>
            </div>

            {/* Card 2 */}
            <div className="bg-gray-50-card p-5 rounded-lg shadow-sm border-2 border-blue-50 flex flex-col justify-between h-36">
              <p className="text-blue-700 font-bold uppercase text-xs tracking-wider">Economia Anual</p>
              <div className="text-blue-700 font-black text-4xl tracking-tight">{fmt(resultado.economiaRealCliente * 12)}</div>
              <p className="text-xs text-gray-500 ">Projeção 12 meses</p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-800 p-5 rounded-lg shadow-sm flex flex-col justify-between h-36 text-white">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-wider">Redução na Conta</p>
              <div className="text-emerald-400 font-black text-4xl tracking-tight">{fmtP(resultado.percentualReducaoTotal)}</div>
              <p className="text-xs text-slate-400 ">Desconto imediato</p>
            </div>
          </div>

          {/* TABELA DE DETALHAMENTO TÉCNICO */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-4 pl-3 border-l-8 border-blue-600 uppercase">
              Detalhamento Técnico
            </h3>

            <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-xs tracking-wider">
                    <th className="p-4 text-left font-extrabold w-[40%]">Descrição do Custo</th>
                    <th className="p-4 text-right font-extrabold text-red-900 bg-red-100/50 w-[30%] border-l border-slate-200">Sem Bionova</th>
                    <th className="p-4 text-right font-extrabold text-emerald-900 bg-emerald-100/50 w-[30%] border-l border-slate-200">Com Bionova</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-lg"> 
                  
                  {/* Linhas de Dados */}
                  <tr>
                    <td className="p-3 pl-6 text-slate-700 ">TUSD (Encargos)</td>
                    <td className="p-3 text-right text-red-800 bg-red-50/30  border-l border-slate-100">{fmt(resultado.dadosOriginais.valorTusd)}</td>
                    <td className="p-3 text-right text-slate-800 bg-emerald-50/30 font-bold border-l border-slate-100">{fmt(resultado.detalhes.novoTusd)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-6 text-slate-700 ">Energia (TE)</td>
                    <td className="p-3 text-right text-red-800 bg-red-50/30  border-l border-slate-100">{fmt(resultado.dadosOriginais.valorTe)}</td>
                    <td className="p-3 text-right text-emerald-600 bg-emerald-50/30 font-bold border-l border-slate-100">R$ 0,00</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-6 text-slate-700 ">Bandeiras / Ilum.</td>
                    <td className="p-3 text-right text-red-800 bg-red-50/30  border-l border-slate-100">{fmt(resultado.dadosOriginais.valorBandeira + resultado.dadosOriginais.valorIluminacao)}</td>
                    <td className="p-3 text-right text-slate-800 bg-emerald-50/30 font-bold border-l border-slate-100">{fmt(resultado.dadosOriginais.valorIluminacao)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 pl-6 text-slate-700 ">Outros Itens</td>
                    <td className="p-3 text-right text-red-800 bg-red-50/30  border-l border-slate-100">{fmt(resultado.dadosOriginais.valorOutros)}</td>
                    <td className="p-3 text-right text-slate-800 bg-emerald-50/30 font-bold border-l border-slate-100">{fmt(resultado.dadosOriginais.valorOutros)}</td>
                  </tr>
                  
                  {/* Total Distribuidora */}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="p-4 pl-6 text-slate-800 font-bold">Total Distribuidora</td>
                    <td className="p-4 text-right text-slate-800 font-bold border-l border-slate-200 bg-red-100/50">{fmt(resultado.faturaAtual)}</td>
                    <td className="p-4 text-right text-orange-600 font-bold border-l border-slate-200 bg-emerald-100/50">{fmt(resultado.novaFaturaDistribuidora)}</td>
                  </tr>

                  {/* Assinatura */}
                  <tr className="bg-blue-50 border-t-2 border-white">
                    <td className="p-4 pl-6 text-blue-900 font-bold">+ Assinatura Bionova</td>
                    <td className="p-4 text-right text-gray-500 font-normal border-l border-white">-</td>
                    <td className="p-4 text-right text-blue-700 font-bold border-l border-white">{fmt(resultado.pagamentoUsina)}</td>
                  </tr>

                  {/* CUSTO FINAL (AZUL ÚNICO E LINHA CORRIGIDA) */}
                  <tr className="bg-blue-900 text-white border-t-4 border-blue-900 h-24">
                    <td className="p-4 pl-6 text-xl font-black uppercase tracking-wide align-middle">
                      Custo Final
                    </td>
                    
                    {/* Valor Antigo: Branco Riscado Centralizado */}
                    <td className="p-4 text-right border-l border-blue-800 align-middle">
                      <div className="flex justify-end items-center h-full">
                        <div className="relative inline-block">
                          <span className="text-2xl font-bold text-white/80">{fmt(resultado.faturaAtual)}</span>
                          {/* Risco Vermelho Absoluto (Não bugará mais) */}
                          <div className="absolute top-1/2 left-0 w-full h-[3px] bg-red-500 rounded-full -translate-y-1/2"></div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Valor Novo: Verde Neon Centralizado */}
                    <td className="p-4 text-right border-l border-blue-800 align-middle">
                      <div className="flex justify-end items-center h-full">
                        <span className="text-4xl font-black text-emerald-400">{fmt(resultado.novoCustoTotal)}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-auto border-t border-slate-200 pt-6">
              <div className="flex justify-between items-center text-slate-500">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Globe size={18} className="text-blue-600"/> www.bionovaenergia.com.br
                </div>
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Phone size={18} className="text-emerald-600"/> (44) 99999-9999
                </div>
              </div>
          </div>

      </div>
    </div>
  );
}
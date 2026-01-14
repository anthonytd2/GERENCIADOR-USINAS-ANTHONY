import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { calcularEconomia, DadosSimulacao } from '../../utils/calculadoraSolar';
import { Save, Calculator, FileText, Search, User, ArrowRight } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function NovoSimulador() {
  // --- ESTADOS ---
  const [loading, setLoading] = useState(true);
  const [tipoCliente, setTipoCliente] = useState<'base' | 'prospect'>('prospect');
  
  // Listas para seleção
  const [clientesBase, setClientesBase] = useState<any[]>([]);
  const [concessionarias, setConcessionarias] = useState<any[]>([]);
  
  // Controle de Seleção
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  
  // Formulário Principal
  const [form, setForm] = useState({
    nome: '',
    uc: '',
    concessionaria_id: '',
    
    // Dados Financeiros
    consumoKwh: '',
    valorTusd: '',
    valorTe: '',
    valorBandeira: '0',
    valorIluminacao: '0',
    valorOutros: '0',
    
    // Parâmetros Técnicos (Lei 14.300)
    fioB_Total: '0.1450', // Padrão editável
    fioB_Percentual: '60', // Padrão 2026
    
    // Impostos (Valores em R$)
    valorPis: '0',
    valorCofins: '0',
    valorIcms: '0',
    
    descontoBionova: '20'
  });

  const [resultado, setResultado] = useState<any>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  // --- INICIALIZAÇÃO ---
  useEffect(() => {
    async function loadData() {
      try {
        const [cli, conc] = await Promise.all([
          api.consumidores.list().catch(() => []),
          api.concessionarias.list().catch(() => [])
        ]);
        setClientesBase(cli);
        setConcessionarias(conc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setClienteSelecionadoId(id);
    
    if (id) {
      const cli = clientesBase.find(c => c.consumidorid === Number(id));
      if (cli) {
        setForm(prev => ({
          ...prev,
          nome: cli.nome,
          uc: '', // Deixa vazio pra escolher a UC específica se quiser
          consumoKwh: cli.mediaconsumo ? String(cli.mediaconsumo) : prev.consumoKwh
        }));
      }
    } else {
      setForm(prev => ({ ...prev, nome: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converte tudo para número
    const dados: DadosSimulacao = {
      consumoKwh: Number(form.consumoKwh),
      valorTusd: Number(form.valorTusd),
      valorTe: Number(form.valorTe),
      valorBandeira: Number(form.valorBandeira),
      valorIluminacao: Number(form.valorIluminacao),
      valorOutros: Number(form.valorOutros),
      fioB_Total: Number(form.fioB_Total),
      fioB_Percentual: Number(form.fioB_Percentual),
      valorPis: Number(form.valorPis),
      valorCofins: Number(form.valorCofins),
      valorIcms: Number(form.valorIcms),
      descontoBionova: Number(form.descontoBionova)
    };

    const res = calcularEconomia(dados);
    setResultado(res);
  };

  const salvarProposta = async (status: string) => {
    if (!resultado) return alert("Por favor, clique em 'Calcular' antes de salvar.");
    
    const payload = {
      consumidor_id: tipoCliente === 'base' && clienteSelecionadoId ? Number(clienteSelecionadoId) : null,
      nome_cliente_prospect: form.nome,
      concessionaria_id: form.concessionaria_id ? Number(form.concessionaria_id) : null,
      dados_simulacao: form,
      status: status,
      // Futuro: aqui você pode salvar a URL do PDF se fizer upload pro Supabase Storage
    };

    try {
        await api.propostas.create(payload);
        alert(`Proposta salva com sucesso como: ${status}!`);
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar proposta.");
    }
  };

const gerarPDF = () => {
    if (!resultado) return alert("Simule primeiro!");
    
    const element = pdfTemplateRef.current;
    
    // CORREÇÃO 1: Se o elemento não existir por algum motivo, para tudo.
    // Isso resolve o erro: "Type 'null' is not assignable..."
    if (!element) {
        alert("Erro: Modelo do PDF não encontrado.");
        return;
    }
    
    const opt = {
      margin: 0,
      filename: `Proposta_Bionova_${form.nome.replace(/\s+/g, '_')}.pdf`,
      // CORREÇÃO 2: Usamos 'as const' para jurar pro TypeScript que esses textos não vão mudar.
      // Isso resolve o erro: "Type 'string' is not assignable to type 'jpeg'..."
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    // Aqui usamos 'as any' no opt apenas por segurança caso a biblioteca tenha definições extras
    html2pdf().set(opt).from(element).save();
    
    salvarProposta('Enviada');
  };

  // Funções Auxiliares de Formatação
  const fmtMoeda = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtNum = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v);

  if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
          <Calculator className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Simulador Comercial</h1>
          <p className="text-gray-500">Gere propostas precisas com a regra da Lei 14.300</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- COLUNA ESQUERDA: FORMULÁRIO (lg:col-span-5) --- */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CARD 1: IDENTIFICAÇÃO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600"/> Dados do Cliente
            </h2>
            
            {/* Switch Tipo Cliente */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setTipoCliente('base')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tipoCliente === 'base' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
              >
                Cliente da Base
              </button>
              <button 
                onClick={() => setTipoCliente('prospect')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tipoCliente === 'prospect' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}
              >
                Novo Prospect
              </button>
            </div>

            {tipoCliente === 'base' ? (
               <div className="mb-4">
                 <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Buscar Cliente</label>
                 <div className="relative">
                   <select 
                     className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                     value={clienteSelecionadoId}
                     onChange={handleClienteChange}
                   >
                     <option value="">Selecione um cliente...</option>
                     {clientesBase.map(c => (
                       <option key={c.consumidorid} value={c.consumidorid}>{c.nome}</option>
                     ))}
                   </select>
                   <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none"/>
                 </div>
               </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  name="nome"
                  value={form.nome} 
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nº da UC</label>
                <input 
                  type="text" 
                  name="uc"
                  value={form.uc}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Ex: 12345678"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Concessionária</label>
                <select 
                  name="concessionaria_id"
                  value={form.concessionaria_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="">Selecione...</option>
                  {concessionarias.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CARD 2: DADOS FINANCEIROS */}
          <form onSubmit={handleSimular} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600"/> Dados da Fatura
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Consumo Mensal (kWh)</label>
                <input type="number" name="consumoKwh" required value={form.consumoKwh} onChange={handleInputChange} className="w-full p-2 border rounded-lg text-lg font-bold text-blue-900 bg-blue-50" placeholder="0" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TUSD Total (R$)</label>
                  <input type="number" step="0.01" name="valorTusd" required value={form.valorTusd} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">TE Total (R$)</label>
                  <input type="number" step="0.01" name="valorTe" required value={form.valorTe} onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bandeira (R$)</label>
                  <input type="number" step="0.01" name="valorBandeira" value={form.valorBandeira} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ilum. Pública (R$)</label>
                  <input type="number" step="0.01" name="valorIluminacao" value={form.valorIluminacao} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Outros/Multas (R$)</label>
                  <input type="number" step="0.01" name="valorOutros" value={form.valorOutros} onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Impostos (para abater)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500">PIS (R$)</label>
                    <input type="number" step="0.01" name="valorPis" value={form.valorPis} onChange={handleInputChange} className="w-full p-1.5 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">COFINS (R$)</label>
                    <input type="number" step="0.01" name="valorCofins" value={form.valorCofins} onChange={handleInputChange} className="w-full p-1.5 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500">ICMS TUSD (R$)</label>
                    <input type="number" step="0.01" name="valorIcms" value={form.valorIcms} onChange={handleInputChange} className="w-full p-1.5 border rounded text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <h3 className="text-xs font-bold text-orange-800 mb-2 uppercase">Regra Fio B (Lei 14.300)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-orange-700">Tarifa Fio B Total</label>
                    <input type="number" step="0.0001" name="fioB_Total" value={form.fioB_Total} onChange={handleInputChange} className="w-full p-1.5 border border-orange-200 rounded text-sm text-orange-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-orange-700">% Transição (ex: 60)</label>
                    <input type="number" name="fioB_Percentual" value={form.fioB_Percentual} onChange={handleInputChange} className="w-full p-1.5 border border-orange-200 rounded text-sm text-orange-900" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-blue-900 mb-1">Desconto Bionova (%)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" min="0" max="30" step="1" name="descontoBionova" 
                    value={form.descontoBionova} onChange={handleInputChange} 
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xl font-bold text-blue-600 w-12 text-center">{form.descontoBionova}%</span>
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2">
                <Calculator className="w-5 h-5" /> Calcular Economia
              </button>
            </div>
          </form>
        </div>

        {/* --- COLUNA DIREITA: RESULTADOS (lg:col-span-7) --- */}
        <div className="lg:col-span-7">
          {!resultado ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl min-h-[400px] text-gray-400">
              <Calculator className="w-16 h-16 mb-4 opacity-20" />
              <p>Preencha os dados e clique em calcular</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* BLOCO DE DESTAQUE */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <p className="text-blue-100 text-sm font-medium mb-1">Economia Mensal Estimada</p>
                  <h2 className="text-4xl font-bold mb-4">{fmtMoeda(resultado.economiaRealCliente)}</h2>
                  <div className="flex gap-4 text-sm opacity-90">
                    <div>
                      <span className="block text-xs uppercase">Anual (12 meses)</span>
                      <span className="font-semibold">{fmtMoeda(resultado.economiaRealCliente * 12)}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase">Em 5 anos</span>
                      <span className="font-semibold">{fmtMoeda(resultado.economiaRealCliente * 60)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELA COMPARATIVA */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Demonstrativo Financeiro</h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Consumo: {form.consumoKwh} kWh</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase text-left">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3 text-right">Sem Bionova</th>
                      <th className="px-4 py-3 text-right text-blue-700 font-bold">Com Bionova</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-3 text-gray-600">Distribuidora (Novo TUSD + Taxas)</td>
                      <td className="px-4 py-3 text-right font-medium">{fmtMoeda(resultado.faturaAtual)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{fmtMoeda(resultado.novaFaturaComSolar)}</td>
                    </tr>
                    <tr className="bg-green-50">
                      <td className="px-4 py-3 text-green-800 font-medium">Boleto Usina (Aluguel)</td>
                      <td className="px-4 py-3 text-right text-gray-400">-</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{fmtMoeda(resultado.pagamentoUsina)}</td>
                    </tr>
                    <tr className="bg-gray-50 font-bold text-base">
                      <td className="px-4 py-4 text-gray-900">CUSTO FINAL</td>
                      <td className="px-4 py-4 text-right text-gray-500 line-through decoration-red-500">{fmtMoeda(resultado.faturaAtual)}</td>
                      <td className="px-4 py-4 text-right text-blue-700">{fmtMoeda(resultado.novoCustoTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* AÇÕES */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => salvarProposta('Rascunho')}
                  className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salvar Rascunho
                </button>
                <button 
                  onClick={gerarPDF}
                  className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" /> Gerar Proposta (PDF)
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* --- MOLDE DO PDF (Escondido) --- */}
      {resultado && (
        <div style={{ position: 'absolute', top: -9999, left: -9999 }}>
          <div ref={pdfTemplateRef} className="w-[210mm] min-h-[297mm] bg-white text-black font-sans p-[20mm]">
            
            {/* CAPA DO PDF */}
            <div className="text-center mb-10 border-b-4 border-orange-500 pb-10">
              <h1 className="text-4xl font-bold text-[#212540] mb-2">PROPOSTA COMERCIAL</h1>
              <p className="text-lg text-gray-600">Locação de Usina Solar</p>
              <div className="mt-8 bg-gray-100 p-6 rounded-xl border text-left inline-block w-full max-w-lg">
                <p className="text-lg mb-2"><strong>Cliente:</strong> {form.nome}</p>
                <p className="text-lg mb-2"><strong>UC:</strong> {form.uc || 'N/A'}</p>
                <p className="text-lg"><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* CONTEÚDO */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#212540] mb-4 border-b pb-2">Resumo da Economia</h3>
              <table className="w-full text-sm mb-6 border-collapse">
                <thead>
                  <tr className="bg-[#212540] text-white">
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-right">Atual</th>
                    <th className="p-3 text-right">Com Bionova</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b">Consumo ({form.consumoKwh} kWh)</td>
                    <td className="p-3 border-b text-right">{fmtMoeda(resultado.faturaAtual)}</td>
                    <td className="p-3 border-b text-right font-bold">{fmtMoeda(resultado.novaFaturaComSolar)}</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b">Pagamento à Usina</td>
                    <td className="p-3 border-b text-right">-</td>
                    <td className="p-3 border-b text-right">{fmtMoeda(resultado.pagamentoUsina)}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold text-lg">
                    <td className="p-3">TOTAL A PAGAR</td>
                    <td className="p-3 text-right">{fmtMoeda(resultado.faturaAtual)}</td>
                    <td className="p-3 text-right text-blue-700">{fmtMoeda(resultado.novoCustoTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-[#212540] text-white p-6 rounded-lg text-center">
                <p className="text-lg">Sua economia mensal será de:</p>
                <h2 className="text-5xl font-bold text-orange-500 my-2">{fmtMoeda(resultado.economiaRealCliente)}</h2>
                <p className="opacity-80">Isso representa {fmtMoeda(resultado.economiaRealCliente * 12)} ao ano!</p>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-20">
              <p>Proposta válida por 15 dias. Bionova Energia Solar.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
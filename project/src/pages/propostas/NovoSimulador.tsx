import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { calcularEconomia, DadosSimulacao } from '../../utils/calculadoraSolar';
import { Save, Calculator, FileText, User, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function NovoSimulador() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<'base' | 'prospect'>('base');
  
  const [clientesBase, setClientesBase] = useState<any[]>([]);
  const [concessionarias, setConcessionarias] = useState<any[]>([]);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState('');
  
  const [form, setForm] = useState({
    nome: '',
    uc: '',
    concessionaria_id: '',
    consumoKwh: '',
    valorTusd: '',
    valorTe: '',
    valorBandeira: '0',
    valorIluminacao: '0',
    valorOutros: '0',
    fioB_Total: '0.1450', 
    fioB_Percentual: '60', 
    valorPis: '0',
    valorCofins: '0',
    valorIcms: '0',
    descontoBionova: '20'
  });

  const [resultado, setResultado] = useState<any>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cli, conc] = await Promise.all([
          api.consumidores.list().catch(() => []),
          api.concessionarias.list().catch(() => [])
        ]);
        setClientesBase(Array.isArray(cli) ? cli : []);
        setConcessionarias(Array.isArray(conc) ? conc : []);

        if (id && id !== 'novo') {
          const proposta = await api.propostas.get(Number(id));
          if (proposta && proposta.dados_simulacao) {
            let savedData = proposta.dados_simulacao;
            // Garante que é objeto se vier string
            if (typeof savedData === 'string') {
                try { savedData = JSON.parse(savedData); } catch (e) { savedData = {}; }
            }

            setForm({
               nome: proposta.nome_cliente_prospect || '',
               uc: savedData.uc || '',
               concessionaria_id: savedData.concessionaria_id || '',
               consumoKwh: String(savedData.consumoKwh || ''),
               valorTusd: String(savedData.valorTusd || ''),
               valorTe: String(savedData.valorTe || ''),
               valorBandeira: String(savedData.valorBandeira || '0'),
               valorIluminacao: String(savedData.valorIluminacao || '0'),
               valorOutros: String(savedData.valorOutros || '0'),
               fioB_Total: String(savedData.fioB_Total || '0.1450'),
               fioB_Percentual: String(savedData.fioB_Percentual || '60'),
               valorPis: String(savedData.valorPis || '0'),
               valorCofins: String(savedData.valorCofins || '0'),
               valorIcms: String(savedData.valorIcms || '0'),
               descontoBionova: String(savedData.descontoBionova || '20')
            });

            if (proposta.consumidor_id) {
               setTipoCliente('base');
               setClienteSelecionadoId(String(proposta.consumidor_id));
            } else {
               setTipoCliente('prospect');
            }
            
            // Recalcula se tiver dados suficientes
            if (savedData.consumoKwh && savedData.valorTusd) {
                const dadosCalc: DadosSimulacao = {
                    consumoKwh: Number(savedData.consumoKwh),
                    valorTusd: Number(savedData.valorTusd),
                    valorTe: Number(savedData.valorTe),
                    valorBandeira: Number(savedData.valorBandeira),
                    valorIluminacao: Number(savedData.valorIluminacao),
                    valorOutros: Number(savedData.valorOutros),
                    fioB_Total: Number(savedData.fioB_Total),
                    fioB_Percentual: Number(savedData.fioB_Percentual),
                    valorPis: Number(savedData.valorPis),
                    valorCofins: Number(savedData.valorCofins),
                    valorIcms: Number(savedData.valorIcms),
                    descontoBionova: Number(savedData.descontoBionova)
                };
                setResultado(calcularEconomia(dadosCalc));
            }
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dados", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setClienteSelecionadoId(selectedId);
    if (selectedId) {
      const cli = clientesBase.find(c => c.consumidor_id === Number(selectedId));
      if (cli) {
        setForm(prev => ({
          ...prev,
          nome: cli.nome || '',
          uc: cli.documento || '', 
          consumoKwh: cli.media_consumo ? String(cli.media_consumo) : prev.consumoKwh
        }));
      }
    } else {
      setForm(prev => ({ ...prev, nome: '', uc: '', consumoKwh: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
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
    setResultado(calcularEconomia(dados));
  };

  const salvarProposta = async (status: string) => {
    if (!resultado) return alert("Calcule antes de salvar!");
    try {
        const payload = {
          consumidor_id: tipoCliente === 'base' && clienteSelecionadoId ? Number(clienteSelecionadoId) : null,
          nome_cliente_prospect: form.nome,
          concessionaria_id: form.concessionaria_id ? Number(form.concessionaria_id) : null,
          dados_simulacao: { ...form, ...resultado }, 
          status: status,
        };

        if (id && id !== 'novo') {
            await api.propostas.update(Number(id), payload);
        } else {
            await api.propostas.create(payload);
        }
        
        if(confirm(`Proposta salva com sucesso como ${status}! Ir para o Pipeline?`)) {
            navigate('/propostas');
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar proposta.");
    }
  };

  const gerarPDF = () => {
    if (!resultado || !pdfTemplateRef.current) return;
    const opt = {
      margin: 0,
      filename: `Proposta_${form.nome.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(pdfTemplateRef.current).save();
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtP = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v || 0) + '%';

  if (loading) return <div className="p-10 text-center">Carregando simulador...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">{id && id !== 'novo' ? 'Editar Proposta' : 'Simulador Comercial'}</h1>
           <p className="text-gray-500 mt-1">{id && id !== 'novo' ? `Visualizando detalhes da proposta #${id}` : 'Gere propostas detalhadas com cálculo exato'}</p>
        </div>
        <Link to="/propostas" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
           <ArrowLeft className="w-4 h-4" /> Voltar para Pipeline
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* === COLUNA ESQUERDA (FORM) === */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600"/> Cliente
            </h2>
            <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
              <button onClick={() => setTipoCliente('base')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipoCliente === 'base' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>Base</button>
              <button onClick={() => setTipoCliente('prospect')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${tipoCliente === 'prospect' ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>Novo</button>
            </div>
            {tipoCliente === 'base' && (
               <div className="mb-4">
                 <select className="w-full p-2 border rounded-lg bg-white text-sm" value={clienteSelecionadoId} onChange={handleClienteChange}>
                   <option value="">Selecione da lista...</option>
                   {clientesBase.map(c => (
                     <option key={c.consumidor_id} value={c.consumidor_id}>{c.nome}</option>
                   ))}
                 </select>
               </div>
            )}
            <div className="space-y-3">
                <input type="text" name="nome" value={form.nome} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" placeholder="Nome Completo" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" name="uc" value={form.uc} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" placeholder="Nº UC" />
                  <select name="concessionaria_id" value={form.concessionaria_id} onChange={handleInputChange} className="w-full p-2 border rounded text-sm bg-white">
                    <option value="">Concessionária</option>
                    {concessionarias.map(c => <option key={c.concessionaria_id} value={c.concessionaria_id}>{c.nome}</option>)}
                  </select>
                </div>
            </div>
          </div>

          <form onSubmit={handleSimular} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500"/> Fatura Atual
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Consumo (kWh)</label>
                <input type="number" name="consumoKwh" required value={form.consumoKwh} onChange={handleInputChange} className="w-full p-2 border rounded text-lg font-bold text-blue-900 bg-blue-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-gray-600 mb-0.5">TUSD (R$)</label><input type="number" step="0.0001" name="valorTusd" required value={form.valorTusd} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-600 mb-0.5">TE (R$)</label><input type="number" step="0.0001" name="valorTe" required value={form.valorTe} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bandeira (R$)</label><input type="number" step="0.01" name="valorBandeira" value={form.valorBandeira} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-600 mb-0.5">Ilum. Púb (R$)</label><input type="number" step="0.01" name="valorIluminacao" value={form.valorIluminacao} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" /></div>
                <div><label className="block text-[10px] font-bold text-gray-600 mb-0.5">Outros (R$)</label><input type="number" step="0.01" name="valorOutros" value={form.valorOutros} onChange={handleInputChange} className="w-full p-2 border rounded text-sm" /></div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs font-bold mb-2 text-gray-700">Impostos (Digite o valor em R$)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">PIS</label>
                    <input type="number" step="0.01" name="valorPis" value={form.valorPis} onChange={handleInputChange} className="w-full p-1 border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">COFINS</label>
                    <input type="number" step="0.01" name="valorCofins" value={form.valorCofins} onChange={handleInputChange} className="w-full p-1 border rounded text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">ICMS</label>
                    <input type="number" step="0.01" name="valorIcms" value={form.valorIcms} onChange={handleInputChange} className="w-full p-1 border rounded text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded mt-3 border border-orange-100">
                <p className="text-[10px] text-orange-800 font-bold uppercase mb-1">Configuração Fio B</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="0.0001" name="fioB_Total" value={form.fioB_Total} onChange={handleInputChange} className="w-full p-1 text-xs border rounded" />
                  <div className="flex items-center gap-1"><input type="number" name="fioB_Percentual" value={form.fioB_Percentual} onChange={handleInputChange} className="w-12 p-1 text-xs border rounded" /><span className="text-xs">%</span></div>
                </div>
              </div>

              <div className="pt-4">
                  <label className="text-sm font-bold text-blue-900 block mb-1">Desconto Bionova</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min="0" max="30" name="descontoBionova" value={form.descontoBionova} onChange={handleInputChange} className="flex-1" />
                    <span className="text-xl font-bold text-blue-600">{form.descontoBionova}%</span>
                  </div>
              </div>

              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow mt-4 flex justify-center gap-2">
                <Calculator className="w-5 h-5"/> {id && id !== 'novo' ? 'Recalcular' : 'Calcular'}
              </button>
            </div>
          </form>
        </div>

        {/* === COLUNA DIREITA (RESULTADOS) === */}
        <div className="lg:col-span-8">
          {!resultado ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 min-h-[400px]">
              <Calculator className="w-16 h-16 opacity-20 mb-4"/>
              <p>Preencha os dados e clique em Calcular</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                   <div className="absolute right-0 top-0 opacity-10 p-4"><CheckCircle size={80}/></div>
                   <p className="text-green-100 text-sm font-medium mb-1">Economia Real (Seu Bolso)</p>
                   <h3 className="text-3xl font-bold">{fmt(resultado.economiaRealCliente)}</h3>
                   <p className="text-xs mt-2 opacity-80">Por mês</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                   <p className="text-gray-500 text-sm font-medium mb-1">% Redução Fatura Total</p>
                   <h3 className="text-3xl font-bold text-blue-600">{fmtP(resultado.percentualReducaoTotal)}</h3>
                   <p className="text-xs text-gray-400 mt-2">Sobre o custo total atual</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                   <p className="text-gray-500 text-sm font-medium mb-1">Pagamento à Usina</p>
                   <h3 className="text-3xl font-bold text-gray-800">{fmt(resultado.pagamentoUsina)}</h3>
                   <p className="text-xs text-gray-400 mt-2">Assinatura Mensal</p>
                </div>
              </div>

              {/* Tabela Comparativa */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Raio-X da Economia</h3>
                  <span className="text-xs bg-white px-2 py-1 border rounded text-gray-500">Consumo: {form.consumoKwh} kWh</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left">Item da Fatura</th>
                      <th className="px-6 py-3 text-right">Cenário Atual</th>
                      <th className="px-6 py-3 text-right text-blue-700 font-bold">Com Bionova</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="px-6 py-3 text-gray-600">TUSD (Uso do Sistema)</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorTusd * resultado.dadosOriginais.consumoKwh)}</td><td className="px-6 py-3 text-right text-orange-600 font-medium">{fmt(resultado.detalhes.novoTusd)} *</td></tr>
                    <tr><td className="px-6 py-3 text-gray-600">TE (Energia)</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorTe * resultado.dadosOriginais.consumoKwh)}</td><td className="px-6 py-3 text-right text-green-600 font-bold">0,00</td></tr>
                    <tr><td className="px-6 py-3 text-gray-600">Bandeira Tarifária</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorBandeira)}</td><td className="px-6 py-3 text-right text-green-600 font-bold">0,00</td></tr>
                    <tr><td className="px-6 py-3 text-gray-600">Iluminação Pública</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorIluminacao)}</td><td className="px-6 py-3 text-right text-gray-800">{fmt(resultado.dadosOriginais.valorIluminacao)}</td></tr>
                    <tr><td className="px-6 py-3 text-gray-600">Outros / Multas</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorOutros)}</td><td className="px-6 py-3 text-right text-gray-800">{fmt(resultado.dadosOriginais.valorOutros)}</td></tr>
                    <tr className="bg-gray-50 font-medium text-gray-500"><td className="px-6 py-3 italic">Total Distribuidora</td><td className="px-6 py-3 text-right">{fmt(resultado.faturaAtual)}</td><td className="px-6 py-3 text-right">{fmt(resultado.novaFaturaDistribuidora)}</td></tr>
                    <tr className="bg-blue-50/50 border-t-2 border-blue-100"><td className="px-6 py-4 text-blue-900 font-bold">Assinatura Bionova</td><td className="px-6 py-4 text-right text-gray-300">-</td><td className="px-6 py-4 text-right font-bold text-blue-700">{fmt(resultado.pagamentoUsina)}</td></tr>
                    <tr className="bg-gray-100 text-base border-t-2 border-gray-200"><td className="px-6 py-5 font-bold text-gray-900">VOCÊ PAGA NO TOTAL</td><td className="px-6 py-5 text-right font-bold text-gray-500 line-through decoration-red-400">{fmt(resultado.faturaAtual)}</td><td className="px-6 py-5 text-right font-bold text-blue-700 text-lg">{fmt(resultado.novoCustoTotal)}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 pt-4">
                  <button onClick={() => salvarProposta('Rascunho')} className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex justify-center items-center gap-2">
                    <Save className="w-4 h-4"/> Salvar como Nova Versão
                  </button>
                  <button onClick={gerarPDF} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex justify-center items-center gap-2">
                    <FileText className="w-5 h-5"/> Gerar Proposta PDF
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF TEMPLATE */}
      {resultado && (
        <div className="fixed left-[-9999px]">
           <div ref={pdfTemplateRef} className="w-[210mm] min-h-[297mm] bg-white p-[15mm] font-sans text-gray-800">
              <div className="flex justify-between items-end border-b-2 border-blue-600 pb-6 mb-8">
                 <div>
                    <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">PROPOSTA COMERCIAL</h1>
                    <p className="text-lg text-gray-500 font-medium mt-1">Locação de Usina Solar</p>
                 </div>
                 <div className="text-right">
                    <div className="bg-gray-100 p-3 rounded-lg text-sm">
                      <p><strong>Cliente:</strong> {form.nome}</p>
                      <p><strong>UC:</strong> {form.uc || 'N/A'}</p>
                      <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 mb-8">
                 <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <p className="text-green-800 font-semibold mb-2">Economia Mensal Estimada</p>
                    <h2 className="text-5xl font-bold text-green-600">{fmt(resultado.economiaRealCliente)}</h2>
                 </div>
                 <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-blue-800 font-semibold mb-2">Redução Total na Fatura</p>
                    <h2 className="text-5xl font-bold text-blue-600">{fmtP(resultado.percentualReducaoTotal)}</h2>
                 </div>
              </div>

              <h3 className="text-lg font-bold text-gray-700 mb-4 border-l-4 border-blue-500 pl-3">Detalhamento de Custos</h3>
              <table className="w-full text-sm mb-8 border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white">
                     <th className="p-3 text-left">Descrição</th>
                     <th className="p-3 text-right">Cenário Atual</th>
                     <th className="p-3 text-right">Com Bionova</th>
                  </tr>
                </thead>
                <tbody>
                   <tr className="border-b"><td className="p-3">TUSD (Fio B + Encargos)</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorTusd * resultado.dadosOriginais.consumoKwh)}</td><td className="p-3 text-right font-medium">{fmt(resultado.detalhes.novoTusd)}</td></tr>
                   <tr className="border-b"><td className="p-3">TE (Energia Elétrica)</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorTe * resultado.dadosOriginais.consumoKwh)}</td><td className="p-3 text-right font-bold text-green-600">0,00</td></tr>
                   <tr className="border-b"><td className="p-3">Bandeira Tarifária</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorBandeira)}</td><td className="p-3 text-right font-bold text-green-600">0,00</td></tr>
                   <tr className="border-b"><td className="p-3">Iluminação Pública</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorIluminacao)}</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorIluminacao)}</td></tr>
                   <tr className="border-b"><td className="p-3">Outros / Multas</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorOutros)}</td><td className="p-3 text-right">{fmt(resultado.dadosOriginais.valorOutros)}</td></tr>
                   <tr className="bg-gray-100 font-bold border-t-2">
                      <td className="p-3">Fatura Distribuidora (A Pagar)</td><td className="p-3 text-right">{fmt(resultado.faturaAtual)}</td><td className="p-3 text-right">{fmt(resultado.novaFaturaDistribuidora)}</td>
                   </tr>
                   <tr className="bg-blue-50 text-blue-900 font-bold">
                      <td className="p-3">+ Assinatura Bionova</td><td className="p-3 text-right">-</td><td className="p-3 text-right">{fmt(resultado.pagamentoUsina)}</td>
                   </tr>
                   <tr className="bg-gray-800 text-white text-lg font-bold">
                      <td className="p-4">TOTAL FINAL</td><td className="p-4 text-right opacity-70 line-through decoration-white">{fmt(resultado.faturaAtual)}</td><td className="p-4 text-right text-green-400">{fmt(resultado.novoCustoTotal)}</td>
                   </tr>
                </tbody>
              </table>

              <div className="mt-10 border-t pt-4 text-center text-xs text-gray-400">
                 <p>Bionova Energia Solar - Proposta válida por 10 dias.</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
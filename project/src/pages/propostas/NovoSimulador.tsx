import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { calcularEconomia, DadosSimulacao } from '../../utils/calculadoraSolar';
import { Save, Calculator, FileText, User, Zap, CheckCircle, ArrowLeft } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import CurrencyInput from 'react-currency-input-field';
// IMPORTAMOS O NOVO ARQUIVO DE PDF AQUI:
import { PropostaPDF } from './PropostaPDF';

// Função auxiliar para limpar dinheiro
const parseMoney = (value: any) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  let clean = value.replace(/[^\d,.-]/g, '');
  clean = clean.replace(',', '.');
  return parseFloat(clean) || 0;
};

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

            if (savedData.consumoKwh && savedData.valorTusd) {
              setTimeout(() => {
                const dadosCalc: DadosSimulacao = {
                  consumoKwh: Number(savedData.consumoKwh),
                  valorTusd: parseMoney(savedData.valorTusd), 
                  valorTe: parseMoney(savedData.valorTe),
                  valorBandeira: parseMoney(savedData.valorBandeira),
                  valorIluminacao: parseMoney(savedData.valorIluminacao),
                  valorOutros: parseMoney(savedData.valorOutros),
                  fioB_Total: Number(savedData.fioB_Total),
                  fioB_Percentual: Number(savedData.fioB_Percentual),
                  valorPis: parseMoney(savedData.valorPis),
                  valorCofins: parseMoney(savedData.valorCofins),
                  valorIcms: parseMoney(savedData.valorIcms),
                  descontoBionova: Number(savedData.descontoBionova)
                };
                setResultado(calcularEconomia(dadosCalc));
              }, 100);
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
      const cli = clientesBase.find(c => String(c.consumidor_id || c.id) === String(selectedId));
      if (cli) {
        setForm(prev => ({
          ...prev,
          nome: cli.nome || '',
          uc: cli.cpf_cnpj || '',
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

  const handleValorChange = (value: string | undefined, name: string) => {
    setForm(prev => ({ ...prev, [name]: value || '' }));
  };

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
    const dados: DadosSimulacao = {
      consumoKwh: Number(form.consumoKwh),
      valorTusd: parseMoney(form.valorTusd),
      valorTe: parseMoney(form.valorTe),
      valorBandeira: parseMoney(form.valorBandeira),
      valorIluminacao: parseMoney(form.valorIluminacao),
      valorOutros: parseMoney(form.valorOutros),
      fioB_Total: Number(form.fioB_Total),
      fioB_Percentual: Number(form.fioB_Percentual),
      valorPis: parseMoney(form.valorPis),
      valorCofins: parseMoney(form.valorCofins),
      valorIcms: parseMoney(form.valorIcms),
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

      if (confirm(`Proposta salva com sucesso como ${status}! Ir para o Pipeline?`)) {
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
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(pdfTemplateRef.current).save();
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtP = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v || 0) + '%';

  if (loading) return <div className="p-10 text-center">Carregando simulador...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{id && id !== 'novo' ? 'Editar Proposta' : 'Simulador Comercial'}</h1>
          <p className="text-gray-500 mt-1">Preencha os valores TOTAIS (R$) da conta de luz</p>
        </div>
        <Link to="/propostas" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-gray-100 px-4 py-2 rounded-lg">
          <ArrowLeft className="w-4 h-4" /> Voltar para Pipeline
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORMULÁRIO */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Cliente
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
                    <option key={c.consumidor_id || c.id} value={c.consumidor_id || c.id}>{c.nome}</option>
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
                  {concessionarias.map(c => (
                    <option key={c.concessionaria_id || c.id} value={c.concessionaria_id || c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handleSimular} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" /> Valores da Conta (R$)
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Consumo Total (kWh)</label>
                <input type="number" name="consumoKwh" required value={form.consumoKwh} onChange={handleInputChange} className="w-full p-2 border rounded text-lg font-bold text-blue-900 bg-blue-50" />
              </div>

              {/* MÁSCARAS DE DINHEIRO */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">TUSD (Valor R$)</label>
                  <CurrencyInput
                    name="valorTusd"
                    prefix="R$ "
                    decimalSeparator=","
                    groupSeparator="."
                    decimalsLimit={2}
                    value={form.valorTusd}
                    onValueChange={(val) => handleValorChange(val, 'valorTusd')}
                    className="w-full p-2 border rounded text-sm text-right font-medium"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">TE (Valor R$)</label>
                  <CurrencyInput
                    name="valorTe"
                    prefix="R$ "
                    decimalSeparator=","
                    groupSeparator="."
                    decimalsLimit={2}
                    value={form.valorTe}
                    onValueChange={(val) => handleValorChange(val, 'valorTe')}
                    className="w-full p-2 border rounded text-sm text-right font-medium"
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Bandeira (R$)</label>
                  <CurrencyInput
                    name="valorBandeira"
                    prefix="R$ "
                    decimalSeparator=","
                    groupSeparator="."
                    decimalsLimit={2}
                    value={form.valorBandeira}
                    onValueChange={(val) => handleValorChange(val, 'valorBandeira')}
                    className="w-full p-2 border rounded text-sm text-right font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Ilum. Púb (R$)</label>
                  <CurrencyInput
                    name="valorIluminacao"
                    prefix="R$ "
                    decimalSeparator=","
                    groupSeparator="."
                    decimalsLimit={2}
                    value={form.valorIluminacao}
                    onValueChange={(val) => handleValorChange(val, 'valorIluminacao')}
                    className="w-full p-2 border rounded text-sm text-right font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Outros (R$)</label>
                  <CurrencyInput
                    name="valorOutros"
                    prefix="R$ "
                    decimalSeparator=","
                    groupSeparator="."
                    decimalsLimit={2}
                    value={form.valorOutros}
                    onValueChange={(val) => handleValorChange(val, 'valorOutros')}
                    className="w-full p-2 border rounded text-sm text-right font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs font-bold mb-2 text-gray-700">Impostos (Valor R$)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">PIS</label>
                    <CurrencyInput
                      name="valorPis"
                      prefix="R$ "
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      value={form.valorPis}
                      onValueChange={(val) => handleValorChange(val, 'valorPis')}
                      className="w-full p-1 border rounded text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">COFINS</label>
                    <CurrencyInput
                      name="valorCofins"
                      prefix="R$ "
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      value={form.valorCofins}
                      onValueChange={(val) => handleValorChange(val, 'valorCofins')}
                      className="w-full p-1 border rounded text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500">ICMS</label>
                    <CurrencyInput
                      name="valorIcms"
                      prefix="R$ "
                      decimalSeparator=","
                      groupSeparator="."
                      decimalsLimit={2}
                      value={form.valorIcms}
                      onValueChange={(val) => handleValorChange(val, 'valorIcms')}
                      className="w-full p-1 border rounded text-xs text-right"
                    />
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
                <Calculator className="w-5 h-5" /> {id && id !== 'novo' ? 'Recalcular' : 'Calcular'}
              </button>
            </div>
          </form>
        </div>

        {/* COLUNA DIREITA: RESULTADOS */}
        <div className="lg:col-span-8">
          {!resultado ? (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 min-h-[400px]">
              <Calculator className="w-16 h-16 opacity-20 mb-4" />
              <p>Preencha os valores TOTAIS (R$) e clique em Calcular</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 p-4"><CheckCircle size={80} /></div>
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

              {/* Tabela Comparativa (Tela) */}
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
                    <tr><td className="px-6 py-3 text-gray-600">TUSD (Fio B + Encargos)</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorTusd)}</td><td className="px-6 py-3 text-right text-orange-600 font-medium">{fmt(resultado.detalhes.novoTusd)} *</td></tr>
                    <tr><td className="px-6 py-3 text-gray-600">TE (Energia Elétrica)</td><td className="px-6 py-3 text-right">{fmt(resultado.dadosOriginais.valorTe)}</td><td className="px-6 py-3 text-right text-green-600 font-bold">0,00</td></tr>
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
                  <Save className="w-4 h-4" /> Salvar como Nova Versão
                </button>
                <button onClick={gerarPDF} className="flex-[2] py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex justify-center items-center gap-2">
                  <FileText className="w-5 h-5" /> Gerar Proposta PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- RENDERIZAÇÃO DO PDF ESCONDIDA (USANDO O NOVO COMPONENTE) --- */}
      <div className="fixed left-[-9999px]">
        <div ref={pdfTemplateRef}>
          <PropostaPDF form={form} resultado={resultado} />
        </div>
      </div>

    </div>
  );
}
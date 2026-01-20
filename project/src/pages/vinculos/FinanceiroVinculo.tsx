import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient as supabase } from '../../lib/supabaseClient'; 
import { ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, Edit2, X, Zap, TrendingUp, Calculator } from 'lucide-react';

interface Fechamento {
  fechamento_id: number;
  mes_referencia: string;
  energia_compensada: number;
  consumo_rede: number;
  tarifa_kwh: number;
  total_bruto: number;
  tusd_fio_b: number;
  total_fio_b: number;
  valor_fatura_geradora: number;
  spread: number;
  tarifa_com_imposto: number;
  iluminacao_publica: number;
  outras_taxas: number;
  valor_pago_fatura: number;
  economia_gerada: number;
  valor_recebido: number;
  arquivo_url?: string;
  recibo_url?: string;
}

interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  status: { descricao: string };
  consumidores: { nome: string; documento: string; percentual_desconto: number };
  usinas: { nome_proprietario: string; nome: string };
}

export default function FinanceiroVinculo() {
  const { id } = useParams();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    mes_referencia: '', 
    // Usina (Azul)
    consumo_rede: '', // Este campo será usado como "Energia Consumida" no cálculo da Copel
    energia_compensada: '', 
    tarifa_kwh: '', 
    tusd_fio_b: '', 
    valor_fatura_geradora: '',
    // Consumidor (Verde)
    tarifa_com_imposto: '', 
    iluminacao_publica: '', 
    outras_taxas: '', 
    valor_pago_fatura: '',
    percentual_desconto: '', 
    // Arquivos
    arquivo: null as File | null, 
    recibo: null as File | null, 
    arquivo_url_existente: null as string | null, 
    recibo_url_existente: null as string | null
  });

  const [calculos, setCalculos] = useState({
    totalBruto: 0, 
    custoFioB: 0, 
    totalLiquidoPagar: 0, // Spread Usina
    
    totalPagariaCopel: 0,
    economia: 0, 
    descontoAplicado: 0, 
    totalReceberFinal: 0
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);
      
      // Ao carregar o vínculo, se for um NOVO formulário, já preenche o desconto padrão
      if (!editingId && !formData.percentual_desconto) {
        setFormData(prev => ({
            ...prev,
            percentual_desconto: String(dadosVinculo.consumidores?.percentual_desconto || 0)
        }));
      }

      try {
        const dadosFechamentos = await api.financeiro.list(Number(id));
        setFechamentos(Array.isArray(dadosFechamentos) ? dadosFechamentos : []);
      } catch (e) { setFechamentos([]); }
    } catch (error) { alert('Erro ao carregar detalhes.'); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) carregarDados(); }, [id]);

  // --- CÁLCULO EM TEMPO REAL ---
  useEffect(() => {
    // 1. DADOS DO GERADOR (Captura inputs)
    const energiaCompensada = parseFloat(formData.energia_compensada) || 0;
    const consumoRede = parseFloat(formData.consumo_rede) || 0; // "Energia Consumida"
    const valorKwh = parseFloat(formData.tarifa_kwh) || 0;
    const difTusd = parseFloat(formData.tusd_fio_b) || 0;
    const faturaGeradora = parseFloat(formData.valor_fatura_geradora) || 0;

    // LADO USINA (Cálculo do Spread)
    const totalBruto = energiaCompensada * valorKwh;
    const custoFioB = energiaCompensada * difTusd;
    const totalLiquidoPagar = totalBruto - custoFioB - faturaGeradora;

    // 2. DADOS DO CONSUMIDOR (Captura inputs)
    const tarifaImposto = parseFloat(formData.tarifa_com_imposto) || 0;
    const ilumPublica = parseFloat(formData.iluminacao_publica) || 0;
    const outrasTaxas = parseFloat(formData.outras_taxas) || 0;
    const valorPagoFatura = parseFloat(formData.valor_pago_fatura) || 0;
    const percentualDescManual = parseFloat(formData.percentual_desconto) || 0;

    // NOVA LÓGICA DE NEGÓCIO CORRIGIDA:
    
    // Passo A: O que o cliente pagaria SEM solar? 
    // CORREÇÃO: Usa apenas a Energia Consumida (consumoRede)
    const totalPagariaCopel = (consumoRede * tarifaImposto) + ilumPublica + outrasTaxas;

    // Passo B: Economia na Fatura
    // "Total que Pagaria Copel" - "Valor Pago na Fatura"
    const economia = totalPagariaCopel - valorPagoFatura;

    // Passo C: Desconto e Valor a Receber
    const fatorDesconto = percentualDescManual / 100;
    
    // Valor Economizado com Energia Solar (Parte do Cliente)
    const valorDesconto = economia * fatorDesconto;
    
    // Total a Receber do Consumidor (Sua Parte)
    // Regra: Economia na Fatura - Parte do Cliente
    const totalReceberFinal = economia - valorDesconto;

    setCalculos({ 
        totalBruto, 
        custoFioB, 
        totalLiquidoPagar, 
        totalPagariaCopel, 
        economia, 
        descontoAplicado: valorDesconto, 
        totalReceberFinal 
    });
  }, [formData]);

  const uploadArquivo = async (file: File, bucketName: string) => {
    const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeLimpo}`;
    const { error } = await supabase.storage.from(bucketName).upload(nomeArquivo, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalPlanilhaUrl = formData.arquivo_url_existente;
      let finalReciboUrl = formData.recibo_url_existente;
      if (formData.arquivo) finalPlanilhaUrl = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) finalReciboUrl = await uploadArquivo(formData.recibo, 'comprovantes');

      const payload = {
        vinculo_id: Number(id),
        mes_referencia: formData.mes_referencia,
        energia_compensada: Number(formData.energia_compensada),
        consumo_rede: Number(formData.consumo_rede),
        tarifa_kwh: Number(formData.tarifa_kwh),
        total_bruto: calculos.totalBruto,
        tusd_fio_b: Number(formData.tusd_fio_b),
        total_fio_b: calculos.custoFioB,
        valor_fatura_geradora: Number(formData.valor_fatura_geradora),
        spread: calculos.totalLiquidoPagar,
        tarifa_com_imposto: Number(formData.tarifa_com_imposto),
        iluminacao_publica: Number(formData.iluminacao_publica),
        outras_taxas: Number(formData.outras_taxas),
        valor_pago_fatura: Number(formData.valor_pago_fatura),
        economia_gerada: calculos.economia,
        valor_recebido: calculos.totalReceberFinal,
        arquivo_url: finalPlanilhaUrl,
        recibo_url: finalReciboUrl,
      };

      if (editingId) await api.fechamentos.update(editingId, payload);
      else await api.fechamentos.create(payload);
      
      setShowForm(false); setEditingId(null); carregarDados();
    } catch (error) { alert('Erro ao salvar.'); } finally { setUploading(false); }
  };

  const handleEditar = (item: Fechamento) => {
    setEditingId(item.fechamento_id);
    
    let percentualInferido = '0';
    if(item.economia_gerada > 0) {
        const descontoDado = item.economia_gerada - item.valor_recebido;
        const p = (descontoDado / item.economia_gerada) * 100;
        percentualInferido = p.toFixed(2);
    }

    setFormData({
      mes_referencia: item.mes_referencia,
      consumo_rede: String(item.consumo_rede || ''), 
      energia_compensada: String(item.energia_compensada || ''), 
      tarifa_kwh: String(item.tarifa_kwh || ''), 
      tusd_fio_b: String(item.tusd_fio_b || ''), 
      valor_fatura_geradora: String(item.valor_fatura_geradora || ''),
      
      tarifa_com_imposto: String(item.tarifa_com_imposto || ''), 
      iluminacao_publica: String(item.iluminacao_publica || ''), 
      outras_taxas: String(item.outras_taxas || ''), 
      valor_pago_fatura: String(item.valor_pago_fatura || ''),
      
      percentual_desconto: percentualInferido,

      arquivo: null, recibo: null, 
      arquivo_url_existente: item.arquivo_url || null, 
      recibo_url_existente: item.recibo_url || null
    });
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id: number) => { if (confirm('Excluir?')) { try { await api.fechamentos.delete(id); carregarDados(); } catch (e) { alert('Erro'); } } };

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando dados financeiros...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500">Erro: Vínculo não encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full">
          <Link to={`/vinculos/${id}`} className="p-3 bg-white hover:bg-blue-50 rounded-full text-blue-600 transition-colors shadow-sm border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Financeiro do Vínculo</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-blue-600">Contrato #{vinculo.vinculo_id}</span>
              <span>•</span>
              <Link to={`/consumidores/${vinculo.consumidores?.documento}`} className="text-blue-600 hover:underline font-bold">
                {vinculo.consumidores?.nome}
              </Link>
              <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs font-bold">Desc. Contrato: {vinculo.consumidores?.percentual_desconto}%</span>
            </div>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData(prev => ({...prev, percentual_desconto: String(vinculo.consumidores?.percentual_desconto || 0)}));
          }} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all font-bold">
            <DollarSign size={20} /> Novo Fechamento
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xl p-6 md:p-8 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calculator className="text-blue-600" size={24}/>
              {editingId ? 'Editar Cálculo' : 'Novo Cálculo Financeiro'}
            </h3>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24}/></button>
          </div>
          
          <form onSubmit={handleSalvar}>
            {/* Bloco de Mês */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mês de Referência</label>
              <input required type="date" className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.mes_referencia} onChange={e => setFormData({...formData, mes_referencia: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* COLUNA AZUL: GERADOR (USINA) */}
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase mb-6 flex items-center gap-2 pb-2 border-b border-blue-200">
                  <Zap size={18}/> Usina (Gerador)
                </h4>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Energia Consumida (kWh)</label>
                    <input required type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:border-blue-500 outline-none" 
                        value={formData.consumo_rede} onChange={e => setFormData({...formData, consumo_rede: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Compensada (kWh)</label>
                    <input required type="number" className="w-full p-2 border border-blue-200 rounded-lg focus:border-blue-500 outline-none" 
                        value={formData.energia_compensada} onChange={e => setFormData({...formData, energia_compensada: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Valor kWh (R$)</label>
                    <input required type="number" step="0.0001" className="w-full p-2 border border-blue-200 rounded-lg focus:border-blue-500 outline-none" 
                        value={formData.tarifa_kwh} onChange={e => setFormData({...formData, tarifa_kwh: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-white p-2 rounded-lg border border-blue-100 flex flex-col justify-center">
                    <span className="text-[10px] text-blue-400 font-bold">TOTAL BRUTO</span>
                    <span className="font-bold text-gray-800">R$ {calculos.totalBruto.toFixed(2)}</span>
                  </div>
                  {/* Fio B e Fatura */}
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">TUSD Fio B</label>
                    <input required type="number" step="0.0001" className="w-full p-2 border border-blue-200 rounded-lg outline-none" 
                        value={formData.tusd_fio_b} onChange={e => setFormData({...formData, tusd_fio_b: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Fatura Geradora</label>
                    <input required type="number" step="0.01" className="w-full p-2 border border-blue-200 rounded-lg outline-none" 
                        value={formData.valor_fatura_geradora} onChange={e => setFormData({...formData, valor_fatura_geradora: e.target.value})} />
                  </div>
                  
                  <div className="col-span-2 bg-blue-100 p-3 rounded-lg flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-blue-800">LÍQUIDO A PAGAR (SPREAD)</span>
                    <span className="text-2xl font-black text-blue-700">R$ {calculos.totalLiquidoPagar.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* COLUNA VERDE: CONSUMIDOR (CLIENTE) */}
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                <h4 className="text-sm font-black text-green-800 uppercase mb-6 flex items-center gap-2 pb-2 border-b border-green-200">
                  <TrendingUp size={18}/> Consumidor
                </h4>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Tarifa c/ Imposto</label>
                    <input required type="number" step="0.0001" className="w-full p-2 border border-green-200 rounded-lg focus:border-green-500 outline-none" 
                        value={formData.tarifa_com_imposto} onChange={e => setFormData({...formData, tarifa_com_imposto: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Ilum. Pública</label>
                    <input required type="number" step="0.01" className="w-full p-2 border border-green-200 rounded-lg outline-none" 
                        value={formData.iluminacao_publica} onChange={e => setFormData({...formData, iluminacao_publica: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-bold mb-1 block">Outras Taxas</label>
                    <input required type="number" step="0.01" className="w-full p-2 border border-green-200 rounded-lg outline-none" 
                        value={formData.outras_taxas} onChange={e => setFormData({...formData, outras_taxas: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-red-500 font-bold mb-1 block">Pago Fatura (R$)</label>
                    <input required type="number" step="0.01" className="w-full p-2 border border-red-200 bg-red-50 text-red-700 font-bold rounded-lg outline-none" 
                        value={formData.valor_pago_fatura} onChange={e => setFormData({...formData, valor_pago_fatura: e.target.value})} />
                  </div>

                  {/* RESULTADOS INTERMEDIÁRIOS MAIORES */}
                  <div className="col-span-2 border-t border-green-200 pt-3 mt-2">
                      <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Pagaria Copel:</span>
                          <span className="text-lg font-bold text-gray-800">R$ {calculos.totalPagariaCopel.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-sm text-green-700 font-bold uppercase">Economia na Fatura:</span>
                          <span className="text-xl font-black text-green-700">R$ {calculos.economia.toFixed(2)}</span>
                      </div>
                  </div>

                  {/* NOVO CAMPO DE DESCONTO MANUAL */}
                  <div className="col-span-1">
                    <label className="text-xs text-purple-600 font-bold mb-1 block">Desconto Manual (%)</label>
                    <input required type="number" step="0.01" className="w-full p-2 border border-purple-200 rounded-lg focus:border-purple-500 outline-none text-purple-700 font-bold text-lg" 
                        value={formData.percentual_desconto} onChange={e => setFormData({...formData, percentual_desconto: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-purple-50 p-2 rounded-lg flex flex-col justify-center border border-purple-100">
                     <span className="text-[10px] text-purple-500 font-bold">VALOR CLIENTE (DESC)</span>
                     <span className="font-bold text-purple-800 text-lg">R$ {calculos.descontoAplicado.toFixed(2)}</span>
                  </div>

                  <div className="col-span-2 bg-green-100 p-4 rounded-xl flex flex-col items-center justify-center mt-2 border border-green-200 shadow-sm">
                    <span className="text-sm font-bold text-green-800 uppercase tracking-wider">TOTAL A RECEBER (SUA PARTE)</span>
                    <span className="text-4xl font-black text-green-700 mt-1">R$ {calculos.totalReceberFinal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploads */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
                  <label className="cursor-pointer block">
                    <span className="text-sm font-bold text-gray-600 flex items-center gap-2 mb-2"><FileText size={16}/> Anexar Planilha</span>
                    <input type="file" className="text-xs w-full" onChange={e => setFormData({...formData, arquivo: e.target.files?.[0] || null})} />
                  </label>
               </div>
               <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors">
                  <label className="cursor-pointer block">
                    <span className="text-sm font-bold text-gray-600 flex items-center gap-2 mb-2"><Upload size={16}/> Anexar Recibo</span>
                    <input type="file" className="text-xs w-full" onChange={e => setFormData({...formData, recibo: e.target.files?.[0] || null})} />
                  </label>
               </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-white text-gray-600 border border-gray-200 rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Salvando...' : 'Salvar Cálculo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABELA VISUAL */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4 text-left">Mês</th>
              <th className="px-6 py-4 text-right">Compensada</th>
              <th className="px-6 py-4 text-right text-blue-600">Spread Usina</th>
              <th className="px-6 py-4 text-right text-green-600">Economia</th>
              <th className="px-6 py-4 text-right bg-green-50 text-green-800">A Receber</th>
              <th className="px-6 py-4 text-center">Docs</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fechamentos.map((f) => (
              <tr key={f.fechamento_id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800 capitalize">
                  {new Date(f.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">{f.energia_compensada} kWh</td>
                <td className="px-6 py-4 text-right font-medium text-blue-600">R$ {f.spread?.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-medium text-green-600">R$ {f.economia_gerada?.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-bold text-green-800 bg-green-50/50">R$ {f.valor_recebido?.toFixed(2)}</td>
                <td className="px-6 py-4 text-center flex justify-center gap-2">
                   {f.arquivo_url && <a href={f.arquivo_url} target="_blank" className="text-blue-400 hover:text-blue-600"><FileText size={18}/></a>}
                   {f.recibo_url && <a href={f.recibo_url} target="_blank" className="text-green-400 hover:text-green-600"><Download size={18}/></a>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditar(f)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => handleExcluir(f.fechamento_id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg ml-1"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {fechamentos.length === 0 && <div className="p-12 text-center text-gray-400">Nenhum registro encontrado.</div>}
      </div>
    </div>
  );
}
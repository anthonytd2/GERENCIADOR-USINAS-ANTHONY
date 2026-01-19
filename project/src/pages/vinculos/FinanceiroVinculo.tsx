import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient as supabase } from '../../lib/supabaseClient'; 
import { ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, Edit2, Save, X, Calendar, Zap, TrendingUp, Calculator } from 'lucide-react';

// Tipagem atualizada para o novo banco (snake_case)
interface Fechamento {
  fechamento_id: number;
  mes_referencia: string;
  energia_compensada: number;
  
  // Campos Gerador
  consumo_rede: number;
  tarifa_kwh: number;
  total_bruto: number;
  tusd_fio_b: number;
  total_fio_b: number;
  valor_fatura_geradora: number;
  spread: number; // Lucro Liquido Gerador

  // Campos Consumidor
  tarifa_com_imposto: number;
  iluminacao_publica: number;
  outras_taxas: number;
  valor_pago_fatura: number;
  economia_gerada: number;
  valor_recebido: number; // Total Final a Receber

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

  // ESTADO DO FORMULÁRIO (Strings para facilitar a edição)
  const [formData, setFormData] = useState({
    mes_referencia: '',
    // GERADOR
    consumo_rede: '',
    energia_compensada: '',
    tarifa_kwh: '',
    tusd_fio_b: '',
    valor_fatura_geradora: '',
    // CONSUMIDOR
    tarifa_com_imposto: '',
    iluminacao_publica: '',
    outras_taxas: '',
    valor_pago_fatura: '',
    
    // ARQUIVOS
    arquivo: null as File | null,
    recibo: null as File | null,
    arquivo_url_existente: null as string | null,
    recibo_url_existente: null as string | null
  });

  // ESTADO DE CÁLCULOS (Apenas visualização)
  const [calculos, setCalculos] = useState({
    totalBruto: 0,
    custoFioB: 0,
    totalLiquidoPagar: 0, // Gerador
    totalPagariaCopel: 0,
    economia: 0,
    descontoAplicado: 0,
    totalReceberFinal: 0
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Busca dados do vínculo para pegar o desconto do consumidor
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);

      // Busca histórico de fechamentos
      try {
        const dadosFechamentos = await api.financeiro.list(Number(id));
        setFechamentos(Array.isArray(dadosFechamentos) ? dadosFechamentos : []);
      } catch (e) {
        setFechamentos([]);
      }
    } catch (error) {
      alert('Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  // --- LÓGICA DE CÁLCULO AUTOMÁTICO (Idêntica à original) ---
  useEffect(() => {
    const energiaCompensada = parseFloat(formData.energia_compensada) || 0;
    const energiaConsumida = parseFloat(formData.consumo_rede) || 0;

    // --- CÁLCULO GERADOR ---
    const valorKwh = parseFloat(formData.tarifa_kwh) || 0;
    const difTusd = parseFloat(formData.tusd_fio_b) || 0;
    const faturaGeradora = parseFloat(formData.valor_fatura_geradora) || 0;

    const totalBruto = energiaCompensada * valorKwh;
    const custoFioB = energiaCompensada * difTusd;
    
    // Total Líquido = Bruto - Fio B - Fatura Geradora
    const totalLiquidoPagar = totalBruto - custoFioB - faturaGeradora;

    // --- CÁLCULO CONSUMIDOR ---
    const tarifaImposto = parseFloat(formData.tarifa_com_imposto) || 0;
    const ilumPublica = parseFloat(formData.iluminacao_publica) || 0;
    const outrasTaxas = parseFloat(formData.outras_taxas) || 0;
    const valorPagoFatura = parseFloat(formData.valor_pago_fatura) || 0;

    // Total que pagaria Copel = (Consumida * Tarifa) + Ilum + Taxas
    const totalPagariaCopel = (energiaConsumida * tarifaImposto) + ilumPublica + outrasTaxas;
    const economia = totalPagariaCopel - valorPagoFatura;

    // Desconto (Lógica mantida)
    const percentualDesconto = vinculo?.consumidores?.percentual_desconto || 0;
    const fatorDesconto = percentualDesconto > 1 ? percentualDesconto / 100 : percentualDesconto;
    const valorDesconto = economia * fatorDesconto;

    // Total a Receber = Economia - Desconto
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

  }, [formData, vinculo]);

  const uploadArquivo = async (file: File, bucketName: string) => {
    const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeLimpo}`;
    const { error } = await supabase.storage.from(bucketName).upload(nomeArquivo, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  const handleEditar = (item: Fechamento) => {
    setEditingId(item.fechamento_id);
    setFormData({
      mes_referencia: item.mes_referencia,
      // Gerador
      consumo_rede: String(item.consumo_rede || ''),
      energia_compensada: String(item.energia_compensada || ''),
      tarifa_kwh: String(item.tarifa_kwh || ''),
      tusd_fio_b: String(item.tusd_fio_b || ''),
      valor_fatura_geradora: String(item.valor_fatura_geradora || ''),
      // Consumidor
      tarifa_com_imposto: String(item.tarifa_com_imposto || ''),
      iluminacao_publica: String(item.iluminacao_publica || ''),
      outras_taxas: String(item.outras_taxas || ''),
      valor_pago_fatura: String(item.valor_pago_fatura || ''),
      
      arquivo: null,
      recibo: null,
      arquivo_url_existente: item.arquivo_url || null,
      recibo_url_existente: item.recibo_url || null
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let finalPlanilhaUrl = formData.arquivo_url_existente;
      let finalReciboUrl = formData.recibo_url_existente;

      if (formData.arquivo) finalPlanilhaUrl = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) finalReciboUrl = await uploadArquivo(formData.recibo, 'comprovantes');

      // Payload adaptado para snake_case
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

      if (editingId) {
        await api.fechamentos.update(editingId, payload);
      } else {
        await api.fechamentos.create(payload);
      }
      
      setShowForm(false);
      setEditingId(null);
      carregarDados();
    } catch (error) { 
      console.error(error); 
      alert('Erro ao salvar.'); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      mes_referencia: '', consumo_rede: '', energia_compensada: '', tarifa_kwh: '', tusd_fio_b: '', valor_fatura_geradora: '',
      tarifa_com_imposto: '', iluminacao_publica: '', outras_taxas: '', valor_pago_fatura: '',
      arquivo: null, recibo: null, arquivo_url_existente: null, recibo_url_existente: null
    });
  };

  const handleExcluir = async (fechamentoId: number) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      try { await api.fechamentos.delete(fechamentoId); carregarDados(); } catch (e) { alert('Erro ao excluir'); }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vinculos" className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm bg-gray-50">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-blue-600">#{vinculo.vinculo_id}</span>
              <span>•</span>
              <span>{vinculo.consumidores?.nome}</span>
              <span className="bg-green-100 text-green-800 px-2 rounded-full text-xs font-bold">Desc: {vinculo.consumidores?.percentual_desconto}%</span>
            </div>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
            <DollarSign size={20} /> Novo Cálculo
          </button>
        )}
      </div>

      {/* FORMULÁRIO COMPLETO */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-md p-6">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calculator className="text-blue-600" size={20}/>
              {editingId ? 'Editar Cálculo' : 'Novo Cálculo Financeiro'}
            </h3>
            <button onClick={handleCancelar} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
          </div>

          <form onSubmit={handleSalvar}>
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mês de Referência</label>
              <input required type="date" className="w-full md:w-1/3 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                value={formData.mes_referencia} onChange={e => setFormData({...formData, mes_referencia: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* COLUNA 1: DADOS GERADOR */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 uppercase mb-4 flex items-center gap-2">
                  <Zap size={16}/> Cálculo Gerador (Usina)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Energia Rede (kWh)</label>
                    <input required type="number" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.consumo_rede} onChange={e => setFormData({...formData, consumo_rede: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Energia Compensada (kWh)</label>
                    <input required type="number" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.energia_compensada} onChange={e => setFormData({...formData, energia_compensada: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Valor do kWh (R$)</label>
                    <input required type="number" step="0.0001" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.tarifa_kwh} onChange={e => setFormData({...formData, tarifa_kwh: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-white p-2 rounded border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold block">TOTAL BRUTO</label>
                    <span className="text-sm font-bold text-gray-700">R$ {calculos.totalBruto.toFixed(2)}</span>
                  </div>

                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">DIF TUSD Fio B</label>
                    <input required type="number" step="0.0001" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.tusd_fio_b} onChange={e => setFormData({...formData, tusd_fio_b: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-white p-2 rounded border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold block">CUSTO FIO B</label>
                    <span className="text-sm font-bold text-red-400">- R$ {calculos.custoFioB.toFixed(2)}</span>
                  </div>
                  
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Fatura Geradora (R$)</label>
                    <input required type="number" step="0.01" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.valor_fatura_geradora} onChange={e => setFormData({...formData, valor_fatura_geradora: e.target.value})} />
                  </div>
                  <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-800">TOTAL LÍQUIDO A PAGAR</span>
                      <span className="text-lg font-bold text-blue-700">R$ {calculos.totalLiquidoPagar.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUNA 2: DADOS CONSUMIDOR */}
              <div className="bg-green-50/50 p-5 rounded-xl border border-green-100">
                <h4 className="text-sm font-bold text-green-800 uppercase mb-4 flex items-center gap-2">
                  <TrendingUp size={16}/> Cálculo Consumidor
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Tarifa c/ Imposto</label>
                    <input required type="number" step="0.0001" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.tarifa_com_imposto} onChange={e => setFormData({...formData, tarifa_com_imposto: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Ilum. Pública</label>
                    <input required type="number" step="0.01" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.iluminacao_publica} onChange={e => setFormData({...formData, iluminacao_publica: e.target.value})} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Outras Taxas</label>
                    <input required type="number" step="0.01" className="w-full mt-1 border-gray-200 rounded-md text-sm"
                      value={formData.outras_taxas} onChange={e => setFormData({...formData, outras_taxas: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-white p-2 rounded border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold block">PAGARIA COPEL</label>
                    <span className="text-sm font-bold text-gray-700">R$ {calculos.totalPagariaCopel.toFixed(2)}</span>
                  </div>

                  <div className="col-span-1">
                    <label className="text-xs text-gray-600 font-medium">Valor Pago Fatura</label>
                    <input required type="number" step="0.01" className="w-full mt-1 border-gray-200 rounded-md text-sm font-bold text-red-600"
                      value={formData.valor_pago_fatura} onChange={e => setFormData({...formData, valor_pago_fatura: e.target.value})} />
                  </div>
                  <div className="col-span-1 bg-white p-2 rounded border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold block">ECONOMIA GERADA</label>
                    <span className="text-sm font-bold text-green-600">R$ {calculos.economia.toFixed(2)}</span>
                  </div>

                  <div className="col-span-2 px-3 py-2 bg-gray-100 rounded text-xs text-gray-500 flex justify-between">
                    <span>Desconto ({vinculo.consumidores?.percentual_desconto}%)</span>
                    <span>- R$ {calculos.descontoAplicado.toFixed(2)}</span>
                  </div>

                  <div className="col-span-2 mt-2 pt-2 border-t border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-green-800">TOTAL A RECEBER</span>
                      <span className="text-lg font-bold text-green-700">R$ {calculos.totalReceberFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* UPLOAD DE ARQUIVOS */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-blue-500"/> Planilha / Fatura
                </label>
                {formData.arquivo_url_existente ? (
                  <div className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                    <span className="truncate max-w-[150px]">Arquivo Anexado</span>
                    <button type="button" onClick={() => setFormData({...formData, arquivo_url_existente: null})} className="text-red-500"><X size={14}/></button>
                  </div>
                ) : (
                  <input type="file" className="block w-full text-xs text-gray-500" onChange={e => setFormData({...formData, arquivo: e.target.files ? e.target.files[0] : null})} />
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Upload size={16} className="text-green-500"/> Comprovante / Recibo
                </label>
                {formData.recibo_url_existente ? (
                  <div className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                    <span className="truncate max-w-[150px]">Recibo Anexado</span>
                    <button type="button" onClick={() => setFormData({...formData, recibo_url_existente: null})} className="text-red-500"><X size={14}/></button>
                  </div>
                ) : (
                  <input type="file" className="block w-full text-xs text-gray-500" onChange={e => setFormData({...formData, recibo: e.target.files ? e.target.files[0] : null})} />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={handleCancelar} className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
              <button type="submit" disabled={uploading} className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 shadow-md font-medium ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Save size={18} /> {uploading ? 'Salvando...' : 'Salvar Cálculo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABELA DE HISTÓRICO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2"><Calendar size={18}/> Histórico Financeiro</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Mês</th>
                <th className="px-4 py-3">Compensada</th>
                <th className="px-4 py-3 text-blue-700">Liq. Gerador</th>
                <th className="px-4 py-3 text-green-700">Economia</th>
                <th className="px-4 py-3 text-green-900 font-bold">A Receber</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fechamentos.map((f) => (
                <tr key={f.fechamento_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                    {new Date(f.mes_referencia).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{f.energia_compensada} kWh</td>
                  <td className="px-4 py-3 text-blue-600">R$ {f.spread?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-600">R$ {f.economia_gerada?.toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold text-green-800 bg-green-50">R$ {f.valor_recebido?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      {f.arquivo_url ? <a href={f.arquivo_url} target="_blank" className="text-gray-400 hover:text-blue-600"><FileText size={16}/></a> : <span className="text-gray-200">-</span>}
                      {f.recibo_url ? <a href={f.recibo_url} target="_blank" className="text-gray-400 hover:text-green-600"><Download size={16}/></a> : <span className="text-gray-200">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEditar(f)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Editar"><Edit2 size={16}/></button>
                      <button onClick={() => handleExcluir(f.fechamento_id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Excluir"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fechamentos.length === 0 && <div className="p-8 text-center text-gray-400">Nenhum registro encontrado.</div>}
      </div>
    </div>
  );
}
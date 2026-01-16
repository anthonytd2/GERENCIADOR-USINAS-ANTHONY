import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 
import { ArrowLeft, DollarSign, X, CheckCircle, Calculator, Trash2 } from 'lucide-react';

export default function FinanceiroVinculo() {
  const { id } = useParams();
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // ESTADO COM TODOS OS INPUTS
  const [form, setForm] = useState({
    mes_referencia: '',
    
    // INPUTS - PASSO 1 (GERADOR)
    energia_compensada: '',
    valor_kw_base: '',       
    taxa_fio_b: '',          
    fatura_uc_geradora: '',  

    // INPUTS - PASSO 2 (CLIENTE)
    tarifa_com_imposto: '',  
    valor_pago_fatura: '',   
    taxas_ilum_publica: '',  
    
    // INPUTS - PASSO 3 (EMPRESA)
    total_receber_cliente: '', 

    // RESULTADOS CALCULADOS
    total_bruto_gerador: 0,
    total_liquido_gerador: 0,
    total_simulado_copel: 0,
    economia_real: 0,
    spread_lucro: 0,

    arquivo: null as File | null,
    recibo: null as File | null,
    arquivo_url_existente: null as string | null,
    recibo_url_existente: null as string | null
  });

  const carregar = async () => {
    try {
      setLoading(true);
      const dados = await api.financeiro.list(Number(id));
      setLista(dados || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) carregar(); }, [id]);

  // --- CÁLCULOS AUTOMÁTICOS ---
  useEffect(() => {
    const energia = parseFloat(form.energia_compensada) || 0;
    
    // PASSO 1: O Custo do Gerador
    const valorKw = parseFloat(form.valor_kw_base) || 0;
    const taxaFioB = parseFloat(form.taxa_fio_b) || 0;
    const custoUsina = parseFloat(form.fatura_uc_geradora) || 0;

    const brutoGerador = energia * valorKw;
    const descontoFioB = energia * taxaFioB;
    const liquidoGerador = brutoGerador - descontoFioB - custoUsina;

    // PASSO 2: A Economia do Cliente
    const tarifaCheia = parseFloat(form.tarifa_com_imposto) || 0;
    const taxasFixas = parseFloat(form.taxas_ilum_publica) || 0;
    const pagoResidual = parseFloat(form.valor_pago_fatura) || 0;

    const simuladoCopel = (energia * tarifaCheia) + taxasFixas;
    const economia = simuladoCopel - pagoResidual;

    // PASSO 3: Lucro (Spread)
    const receberCliente = parseFloat(form.total_receber_cliente) || 0;
    const spread = receberCliente - liquidoGerador;

    setForm(prev => ({
      ...prev,
      total_bruto_gerador: brutoGerador,
      total_liquido_gerador: liquidoGerador,
      total_simulado_copel: simuladoCopel,
      economia_real: economia,
      spread_lucro: spread
    }));

  }, [
    form.energia_compensada, form.valor_kw_base, form.taxa_fio_b, form.fatura_uc_geradora,
    form.tarifa_com_imposto, form.taxas_ilum_publica, form.valor_pago_fatura, form.total_receber_cliente
  ]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Upload simples
      const upload = async (file: File) => {
        const nome = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        await supabaseClient.storage.from('documentos').upload(nome, file);
        return supabaseClient.storage.from('documentos').getPublicUrl(nome).data.publicUrl;
      };
      
      let urlArq = form.arquivo_url_existente;
      let urlRec = form.recibo_url_existente;

      if (form.arquivo) urlArq = await upload(form.arquivo);
      if (form.recibo) urlRec = await upload(form.recibo);

      // CORREÇÃO: Payload limpo sem duplicidade
      const payload = {
        vinculo_id: Number(id),
        mes_referencia: form.mes_referencia,
        
        // Convertendo strings para números para o banco
        energia_compensada: Number(form.energia_compensada),
        valor_kw_base: Number(form.valor_kw_base),
        taxa_fio_b: Number(form.taxa_fio_b),
        fatura_uc_geradora: Number(form.fatura_uc_geradora),
        
        tarifa_com_imposto: Number(form.tarifa_com_imposto),
        valor_pago_fatura: Number(form.valor_pago_fatura),
        taxas_ilum_publica: Number(form.taxas_ilum_publica),
        
        total_receber_cliente: Number(form.total_receber_cliente),

        // Resultados calculados
        total_bruto_gerador: form.total_bruto_gerador,
        total_liquido_gerador: form.total_liquido_gerador,
        total_simulado_copel: form.total_simulado_copel,
        economia_real: form.economia_real,
        spread_lucro: form.spread_lucro,

        arquivo_url: urlArq,
        recibo_url: urlRec
      };

      if (editingId) {
        await api.financeiro.update(editingId, payload);
      } else {
        await api.financeiro.create(payload);
      }

      setShowForm(false);
      setEditingId(null);
      // Limpa formulário
      setForm({
        mes_referencia: '', energia_compensada: '', valor_kw_base: '', taxa_fio_b: '', fatura_uc_geradora: '',
        tarifa_com_imposto: '', valor_pago_fatura: '', taxas_ilum_publica: '', total_receber_cliente: '',
        total_bruto_gerador: 0, total_liquido_gerador: 0, total_simulado_copel: 0, economia_real: 0, spread_lucro: 0,
        arquivo: null, recibo: null, arquivo_url_existente: null, recibo_url_existente: null
      });
      carregar();
      alert('Cálculo salvo com sucesso!');
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (itemId: number) => {
    if (confirm('Excluir?')) {
      await api.financeiro.delete(itemId);
      carregar();
    }
  };

  const handleEditar = (item: any) => {
    setEditingId(item.id);
    setForm({
        mes_referencia: item.mes_referencia ? item.mes_referencia.split('T')[0] : '',
        energia_compensada: String(item.energia_compensada),
        valor_kw_base: String(item.valor_kw_base),
        taxa_fio_b: String(item.taxa_fio_b),
        fatura_uc_geradora: String(item.fatura_uc_geradora),
        tarifa_com_imposto: String(item.tarifa_com_imposto),
        valor_pago_fatura: String(item.valor_pago_fatura),
        taxas_ilum_publica: String(item.taxas_ilum_publica),
        total_receber_cliente: String(item.total_receber_cliente),
        
        total_bruto_gerador: Number(item.total_bruto_gerador),
        total_liquido_gerador: Number(item.total_liquido_gerador),
        total_simulado_copel: Number(item.total_simulado_copel),
        economia_real: Number(item.economia_real),
        spread_lucro: Number(item.spread_lucro),

        arquivo: null, recibo: null,
        arquivo_url_existente: item.arquivo_url,
        recibo_url_existente: item.recibo_url
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={`/vinculos/${id}`} className="p-2 bg-gray-100 rounded-full"><ArrowLeft size={20}/></Link>
          <h1 className="text-2xl font-bold">Histórico Financeiro</h1>
        </div>
        {!showForm && <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2"><DollarSign size={20}/> Novo Cálculo</button>}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-fade-in">
          <div className="flex justify-between mb-4 border-b pb-2">
            <h3 className="font-bold text-lg flex gap-2"><Calculator size={20} className="text-blue-600"/> Calculadora de Repasse</h3>
            <button onClick={() => setShowForm(false)}><X/></button>
          </div>
          
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Mês Referência</label>
              <input required type="date" className="border rounded p-2 ml-2" value={form.mes_referencia} onChange={e => setForm({...form, mes_referencia: e.target.value})} />
            </div>

            {/* --- PASSO 1: GERADOR --- */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 lg:col-span-1 space-y-3">
              <h4 className="font-bold text-yellow-800 text-sm border-b border-yellow-200 pb-1">1. DADOS DO GERADOR (USINA)</h4>
              <div>
                <label className="text-xs font-bold text-gray-600">Energia Compensada (kWh)</label>
                <input required type="number" className="w-full border rounded p-1" placeholder="Ex: 1000" value={form.energia_compensada} onChange={e => setForm({...form, energia_compensada: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Valor Base kW (R$)</label>
                <input required type="number" step="0.0001" className="w-full border rounded p-1" placeholder="Ex: 0.44" value={form.valor_kw_base} onChange={e => setForm({...form, valor_kw_base: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Taxa Fio B (Fator)</label>
                <input type="number" step="0.0001" className="w-full border rounded p-1" placeholder="Ex: 0.08" value={form.taxa_fio_b} onChange={e => setForm({...form, taxa_fio_b: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Fatura UC Geradora (R$)</label>
                <input type="number" step="0.01" className="w-full border rounded p-1" value={form.fatura_uc_geradora} onChange={e => setForm({...form, fatura_uc_geradora: e.target.value})} />
              </div>
              <div className="pt-2">
                <label className="text-xs font-bold text-red-600">A PAGAR P/ USINA (LÍQUIDO)</label>
                <div className="text-xl font-bold text-red-700">R$ {form.total_liquido_gerador.toFixed(2)}</div>
              </div>
            </div>

            {/* --- PASSO 2: CLIENTE --- */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 lg:col-span-1 space-y-3">
              <h4 className="font-bold text-blue-800 text-sm border-b border-blue-200 pb-1">2. DADOS DO CLIENTE</h4>
              <div>
                <label className="text-xs font-bold text-gray-600">Tarifa Cheia (TE+TUSD) (R$)</label>
                <input required type="number" step="0.0001" className="w-full border rounded p-1" placeholder="Ex: 0.95" value={form.tarifa_com_imposto} onChange={e => setForm({...form, tarifa_com_imposto: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Taxas Fixas/Ilum. Púb (R$)</label>
                <input type="number" step="0.01" className="w-full border rounded p-1" value={form.taxas_ilum_publica} onChange={e => setForm({...form, taxas_ilum_publica: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Valor Pago na Fatura (Residual)</label>
                <input type="number" step="0.01" className="w-full border rounded p-1" value={form.valor_pago_fatura} onChange={e => setForm({...form, valor_pago_fatura: e.target.value})} />
              </div>
              <div className="pt-2 border-t border-blue-200 mt-2">
                <div className="flex justify-between">
                   <span className="text-xs text-gray-500">Economia Gerada:</span>
                   <span className="text-sm font-bold text-green-600">R$ {form.economia_real.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* --- PASSO 3: SPREAD --- */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 lg:col-span-1 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-green-800 text-sm border-b border-green-200 pb-1">3. FECHAMENTO</h4>
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-600">TOTAL A RECEBER DO CLIENTE (R$)</label>
                  <input required type="number" step="0.01" className="w-full border-2 border-green-400 rounded p-2 text-lg font-bold text-green-800" 
                    placeholder="0.00" value={form.total_receber_cliente} onChange={e => setForm({...form, total_receber_cliente: e.target.value})} />
                  <p className="text-[10px] text-gray-500 mt-1">Preencha conforme contrato (Desconto ou Fixo)</p>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border border-green-100 text-center">
                <label className="text-xs font-bold text-gray-400 uppercase">Seu Lucro (Spread)</label>
                <div className="text-3xl font-black text-blue-900">R$ {form.spread_lucro.toFixed(2)}</div>
                <p className="text-[10px] text-gray-400">Recebido - Pago Usina</p>
              </div>
            </div>

            {/* Uploads */}
            <div className="lg:col-span-3 flex gap-4 border-t pt-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 block mb-1">Fatura</label>
                {form.arquivo_url_existente ? <span className="text-green-600 text-sm flex gap-2"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setForm({...form, arquivo_url_existente: null})} className="text-red-500">X</button></span> : <input type="file" className="text-sm" onChange={e => setForm({...form, arquivo: e.target.files?.[0] || null})} />}
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 block mb-1">Comprovante</label>
                {form.recibo_url_existente ? <span className="text-green-600 text-sm flex gap-2"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setForm({...form, recibo_url_existente: null})} className="text-red-500">X</button></span> : <input type="file" className="text-sm" onChange={e => setForm({...form, recibo: e.target.files?.[0] || null})} />}
              </div>
            </div>

            <div className="lg:col-span-3 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow">{uploading ? 'Salvando...' : 'Salvar Cálculo'}</button>
            </div>
          </form>
        </div>
      )}

      {/* LISTAGEM SIMPLES */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Mês</th>
              <th className="p-4">Energia</th>
              <th className="p-4 text-red-600">Pago Usina</th>
              <th className="p-4 text-green-600">Recebido</th>
              <th className="p-4 text-blue-800 font-bold">Spread</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(item.mes_referencia).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</td>
                <td className="p-4">{item.energia_compensada} kWh</td>
                <td className="p-4 text-red-600">R$ {Number(item.total_liquido_gerador).toFixed(2)}</td>
                <td className="p-4 text-green-600">R$ {Number(item.total_receber_cliente).toFixed(2)}</td>
                <td className="p-4 text-blue-800 font-bold bg-blue-50/30">R$ {Number(item.spread_lucro).toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                   <button onClick={() => handleEditar(item)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><DollarSign size={16}/></button>
                   <button onClick={() => handleExcluir(item.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {!loading && lista.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum cálculo lançado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
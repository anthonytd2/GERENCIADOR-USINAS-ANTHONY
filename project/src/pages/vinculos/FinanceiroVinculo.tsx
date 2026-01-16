import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 
import { ArrowLeft, FileText, DollarSign, Edit2, X, CheckCircle, Calculator, Trash2 } from 'lucide-react';

export default function FinanceiroVinculo() {
  const { id } = useParams();
  
  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Formulário padronizado
  const [form, setForm] = useState({
    mes_referencia: '',
    energia: '',
    tarifa: '',
    recebido: '',
    pago: '',
    spread: '',
    fio_b: '',
    taxas: '',
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
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) carregar(); }, [id]);

  // --- CÁLCULOS AUTOMÁTICOS ---
  useEffect(() => {
    const energia = parseFloat(form.energia) || 0;
    const tarifa = parseFloat(form.tarifa) || 0;
    const fioB = parseFloat(form.fio_b) || 0;
    const taxas = parseFloat(form.taxas) || 0;
    
    // 1. Bruto
    const bruto = energia * tarifa;

    // 2. Sugestão de Pagamento (Bruto - Custos)
    if (!editingId && bruto > 0) {
        const liquido = bruto - fioB - taxas;
        setForm(prev => ({ ...prev, pago: liquido > 0 ? liquido.toFixed(2) : '0.00' }));
    }
  }, [form.energia, form.tarifa, form.fio_b, form.taxas]);

  useEffect(() => {
    const rec = parseFloat(form.recebido) || 0;
    const pag = parseFloat(form.pago) || 0;
    setForm(prev => ({ ...prev, spread: (rec - pag).toFixed(2) }));
  }, [form.recebido, form.pago]);

  // --- SALVAR ---
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      // Uploads
      const upload = async (file: File) => {
        const nome = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { error } = await supabaseClient.storage.from('documentos').upload(nome, file);
        if (error) throw error;
        return supabaseClient.storage.from('documentos').getPublicUrl(nome).data.publicUrl;
      };

      let urlArq = form.arquivo_url_existente;
      let urlRec = form.recibo_url_existente;

      if (form.arquivo) urlArq = await upload(form.arquivo);
      if (form.recibo) urlRec = await upload(form.recibo);

      const payload = {
        vinculo_id: Number(id),
        mes_referencia: form.mes_referencia,
        energia: Number(form.energia),
        tarifa: Number(form.tarifa),
        recebido: Number(form.recebido),
        pago: Number(form.pago),
        spread: Number(form.spread),
        fio_b: Number(form.fio_b),
        taxas: Number(form.taxas),
        arquivo_url: urlArq,
        recibo_url: urlRec
      };

      if (editingId) await api.financeiro.update(editingId, payload);
      else await api.financeiro.create(payload);

      setShowForm(false);
      setEditingId(null);
      setForm({ mes_referencia: '', energia: '', tarifa: '', recebido: '', pago: '', spread: '', fio_b: '', taxas: '', arquivo: null, recibo: null, arquivo_url_existente: null, recibo_url_existente: null });
      carregar();
      alert('Salvo com sucesso!');
    } catch (e: any) {
      alert('Erro ao salvar: ' + e.message);
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
      energia: String(item.energia),
      tarifa: String(item.tarifa),
      recebido: String(item.recebido),
      pago: String(item.pago),
      spread: String(item.spread),
      fio_b: String(item.fio_b),
      taxas: String(item.taxas),
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
        {!showForm && <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2"><DollarSign size={20}/> Novo Lançamento</button>}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-fade-in">
          <div className="flex justify-between mb-4 border-b pb-2">
            <h3 className="font-bold text-lg flex gap-2"><Calculator size={20} className="text-blue-600"/> Dados do Mês</h3>
            <button onClick={() => setShowForm(false)}><X/></button>
          </div>
          
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Mês Ref.</label>
              <input required type="date" className="w-full border rounded p-2" value={form.mes_referencia} onChange={e => setForm({...form, mes_referencia: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Energia (kWh)</label>
              <input required type="number" className="w-full border rounded p-2" value={form.energia} onChange={e => setForm({...form, energia: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Tarifa (R$)</label>
              <input required type="number" step="0.0001" className="w-full border rounded p-2" value={form.tarifa} onChange={e => setForm({...form, tarifa: e.target.value})} />
            </div>
            
            {/* Custos */}
            <div>
              <label className="text-xs font-bold text-red-500 uppercase">Fio B (R$)</label>
              <input type="number" step="0.01" className="w-full border rounded p-2 text-red-700" value={form.fio_b} onChange={e => setForm({...form, fio_b: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-red-500 uppercase">Taxas (R$)</label>
              <input type="number" step="0.01" className="w-full border rounded p-2 text-red-700" value={form.taxas} onChange={e => setForm({...form, taxas: e.target.value})} />
            </div>

            {/* Resultado */}
            <div>
              <label className="text-xs font-bold text-red-700 uppercase">Pago (R$)</label>
              <input required type="number" step="0.01" className="w-full border rounded p-2 bg-red-50 font-bold text-red-700" value={form.pago} onChange={e => setForm({...form, pago: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-green-700 uppercase">Recebido (R$)</label>
              <input required type="number" step="0.01" className="w-full border rounded p-2 bg-green-50 font-bold text-green-700" value={form.recebido} onChange={e => setForm({...form, recebido: e.target.value})} />
            </div>

            <div className="lg:col-span-4 bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-200">
               <span className="font-bold text-blue-900">LUCRO (SPREAD)</span>
               <span className="text-2xl font-bold text-blue-900">R$ {form.spread || '0.00'}</span>
            </div>

            {/* Uploads */}
            <div className="lg:col-span-2 border p-2 rounded border-dashed">
              <label className="block text-sm mb-1">Fatura</label>
              {form.arquivo_url_existente ? <span className="text-green-600 text-sm flex gap-2"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setForm({...form, arquivo_url_existente: null})} className="text-red-500">X</button></span> : <input type="file" onChange={e => setForm({...form, arquivo: e.target.files?.[0] || null})} />}
            </div>
            <div className="lg:col-span-2 border p-2 rounded border-dashed">
               <label className="block text-sm mb-1">Comprovante</label>
               {form.recibo_url_existente ? <span className="text-green-600 text-sm flex gap-2"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setForm({...form, recibo_url_existente: null})} className="text-red-500">X</button></span> : <input type="file" onChange={e => setForm({...form, recibo: e.target.files?.[0] || null})} />}
            </div>

            <div className="lg:col-span-4 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded">{uploading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4">Mês</th><th className="p-4">Energia</th><th className="p-4">Tarifa</th><th className="p-4">Recebido</th><th className="p-4">Pago</th><th className="p-4">Spread</th><th className="p-4">Ações</th></tr>
          </thead>
          <tbody>
            {lista.map(item => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(item.mes_referencia).toLocaleDateString('pt-BR', {timeZone:'UTC'})}</td>
                <td className="p-4">{item.energia} kWh</td>
                <td className="p-4">R$ {item.tarifa}</td>
                <td className="p-4 text-green-600">R$ {Number(item.recebido).toFixed(2)}</td>
                <td className="p-4 text-red-600">R$ {Number(item.pago).toFixed(2)}</td>
                <td className="p-4 text-blue-600 font-bold">R$ {Number(item.spread).toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEditar(item)} className="text-blue-500"><Edit2 size={16}/></button>
                  <button onClick={() => handleExcluir(item.id)} className="text-red-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {!loading && lista.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
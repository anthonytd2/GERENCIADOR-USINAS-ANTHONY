import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// Verifique se o caminho do supabaseClient está correto no seu projeto
import { supabaseClient } from '../../lib/supabaseClient'; 

import { 
  ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, 
  Edit2, Save, X, Calendar, CheckCircle
} from 'lucide-react';

interface Fechamento {
  fechamentoid: number;
  mesreferencia: string;
  energiacompensada: number;
  valorrecebido: number;
  valorpago: number;
  spread: number;
  arquivourl?: string;
  recibourl?: string;
}

export default function FinanceiroVinculo() {
  const { id } = useParams();
  
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    mesreferencia: '',
    energiacompensada: '',
    valorrecebido: '',
    valorpago: '',
    spread: '',
    arquivo: null as File | null,
    recibo: null as File | null,
    arquivourl_existente: null as string | null,
    recibourl_existente: null as string | null
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Aqui sim chamamos a API de fechamentos
      const dadosFechamentos = await api.fechamentos.list(Number(id));
      setFechamentos(dadosFechamentos || []);
    } catch (e: any) {
      console.error("Erro financeiro:", e);
      // O erro aparece apenas aqui, sem quebrar o resto
      alert(`Erro ao buscar dados: ${e.message || 'Erro de conexão'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  useEffect(() => {
    const recebido = parseFloat(formData.valorrecebido) || 0;
    const pago = parseFloat(formData.valorpago) || 0;
    if (formData.valorrecebido || formData.valorpago) {
      setFormData(prev => ({ ...prev, spread: (recebido - pago).toFixed(2) }));
    }
  }, [formData.valorrecebido, formData.valorpago]);

  const uploadArquivo = async (file: File, bucketName: string) => {
    const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeLimpo}`;
    const { error } = await supabaseClient.storage.from(bucketName).upload(nomeArquivo, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  const handleEditar = (item: Fechamento) => {
    setEditingId(item.fechamentoid);
    setFormData({
      mesreferencia: item.mesreferencia ? item.mesreferencia.split('T')[0] : '',
      energiacompensada: String(item.energiacompensada),
      valorrecebido: String(item.valorrecebido),
      valorpago: String(item.valorpago),
      spread: String(item.spread),
      arquivo: null,
      recibo: null,
      arquivourl_existente: item.arquivourl || null,
      recibourl_existente: item.recibourl || null
    });
    setShowForm(true);
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ mesreferencia: '', energiacompensada: '', valorrecebido: '', valorpago: '', spread: '', arquivo: null, recibo: null, arquivourl_existente: null, recibourl_existente: null });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalPlanilhaUrl = formData.arquivourl_existente;
      let finalReciboUrl = formData.recibourl_existente;

      if (formData.arquivo) finalPlanilhaUrl = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) finalReciboUrl = await uploadArquivo(formData.recibo, 'comprovantes');

      const payload = {
        MesReferencia: formData.mesreferencia,
        EnergiaCompensada: Number(formData.energiacompensada),
        ValorRecebido: Number(formData.valorrecebido),
        ValorPago: Number(formData.valorpago),
        Spread: Number(formData.spread),
        ArquivoURL: finalPlanilhaUrl,
        ReciboURL: finalReciboUrl,
        VinculoID: Number(id)
      };

      if (editingId) await api.fechamentos.update(editingId, payload);
      else await api.fechamentos.create(payload);

      handleCancelar();
      carregarDados();
      alert('Salvo com sucesso!');

    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (fechamentoId: number) => {
    if (confirm('Tem certeza?')) {
      try {
        await api.fechamentos.delete(fechamentoId);
        carregarDados();
      } catch (e) {
        alert('Erro ao excluir');
      }
    }
  };

  const removerArquivoExistente = () => setFormData(prev => ({ ...prev, arquivourl_existente: null }));
  const removerReciboExistente = () => setFormData(prev => ({ ...prev, recibourl_existente: null }));

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/vinculos/${id}`} className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm bg-gray-50">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Histórico Financeiro</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">Vínculo #{id}</div>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all">
            <DollarSign size={20} /> Lançar Mês
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-md p-6 animate-fade-in-down">
          {/* ... Formulário igual ao anterior ... */}
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
             <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mês Ref.</label>
              <input required type="date" className="w-full border-gray-200 rounded-lg" value={formData.mesreferencia} onChange={e => setFormData({...formData, mesreferencia: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Energia (kWh)</label>
              <input required type="number" className="w-full border-gray-200 rounded-lg" value={formData.energiacompensada} onChange={e => setFormData({...formData, energiacompensada: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Recebido</label>
              <input required type="number" step="0.01" className="w-full border-gray-200 rounded-lg text-green-700 font-semibold" value={formData.valorrecebido} onChange={e => setFormData({...formData, valorrecebido: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pago</label>
              <input required type="number" step="0.01" className="w-full border-gray-200 rounded-lg text-red-700 font-semibold" value={formData.valorpago} onChange={e => setFormData({...formData, valorpago: e.target.value})} />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Spread</label>
              <input readOnly type="number" className="w-full bg-gray-100 border-gray-200 rounded-lg text-blue-700 font-bold" value={formData.spread} />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Planilha/Fatura</label>
              {formData.arquivourl_existente ? <div className="text-green-600 text-sm flex gap-2"><CheckCircle size={16}/> Anexado <button type="button" onClick={removerArquivoExistente} className="text-red-500"><X size={14}/></button></div> : <input type="file" onChange={e => setFormData({...formData, arquivo: e.target.files?.[0] || null})} />}
            </div>
             <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comprovante</label>
              {formData.recibourl_existente ? <div className="text-green-600 text-sm flex gap-2"><CheckCircle size={16}/> Anexado <button type="button" onClick={removerReciboExistente} className="text-red-500"><X size={14}/></button></div> : <input type="file" onChange={e => setFormData({...formData, recibo: e.target.files?.[0] || null})} />}
            </div>
            <div className="lg:col-span-6 flex justify-end gap-3 mt-4">
               <button type="button" onClick={handleCancelar} className="px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
               <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{uploading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela Simplificada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         {loading ? <div className="p-8 text-center">Carregando...</div> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr><th className="px-6 py-4">Mês</th><th className="px-6 py-4">Energia</th><th className="px-6 py-4">Recebido</th><th className="px-6 py-4">Pago</th><th className="px-6 py-4">Ações</th></tr>
            </thead>
            <tbody>
              {fechamentos.map(f => (
                <tr key={f.fechamentoid} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                  <td className="px-6 py-4">{f.energiacompensada} kWh</td>
                  <td className="px-6 py-4 text-green-600">R$ {Number(f.valorrecebido).toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-600">R$ {Number(f.valorpago).toFixed(2)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleEditar(f)} className="text-blue-600"><Edit2 size={16}/></button>
                    <button onClick={() => handleExcluir(f.fechamentoid)} className="text-red-600"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         )}
         {!loading && fechamentos.length === 0 && <div className="p-8 text-center text-gray-400">Nenhum registro.</div>}
      </div>
    </div>
  );
}
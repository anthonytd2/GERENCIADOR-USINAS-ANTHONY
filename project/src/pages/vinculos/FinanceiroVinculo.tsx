import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// Verifique se o caminho do supabaseClient está correto no seu projeto
import { supabaseClient } from '../../lib/supabaseClient'; 

import { 
  ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, 
  Edit2, Save, X, CheckCircle
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
      const dados = await api.fechamentos.list(Number(id));
      setFechamentos(dados || []);
    } catch (e: any) {
      console.error(e);
      // Evita alerta excessivo se for apenas lista vazia ou erro menor, 
      // mas mostra se for crítico
      if (e.message !== 'Unexpected end of JSON input') {
          alert('Erro ao carregar dados financeiros: ' + (e.message || 'Erro desconhecido'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) carregarDados(); }, [id]);

  useEffect(() => {
    const recebido = parseFloat(formData.valorrecebido) || 0;
    const pago = parseFloat(formData.valorpago) || 0;
    setFormData(prev => ({ ...prev, spread: (recebido - pago).toFixed(2) }));
  }, [formData.valorrecebido, formData.valorpago]);

  const uploadArquivo = async (file: File, bucket: string) => {
    const nome = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(nome, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(nome);
    return data.publicUrl;
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let urlArq = formData.arquivourl_existente;
      let urlRec = formData.recibourl_existente;
      if (formData.arquivo) urlArq = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) urlRec = await uploadArquivo(formData.recibo, 'comprovantes');

      const payload = {
        MesReferencia: formData.mesreferencia,
        EnergiaCompensada: Number(formData.energiacompensada),
        ValorRecebido: Number(formData.valorrecebido),
        ValorPago: Number(formData.valorpago),
        Spread: Number(formData.spread),
        ArquivoURL: urlArq,
        ReciboURL: urlRec,
        VinculoID: Number(id)
      };

      if (editingId) await api.fechamentos.update(editingId, payload);
      else await api.fechamentos.create(payload);

      setShowForm(false);
      setEditingId(null);
      setFormData({ mesreferencia: '', energiacompensada: '', valorrecebido: '', valorpago: '', spread: '', arquivo: null, recibo: null, arquivourl_existente: null, recibourl_existente: null });
      carregarDados();
      alert('Salvo com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (fid: number) => {
    if (confirm('Excluir lançamento?')) {
      await api.fechamentos.delete(fid);
      carregarDados();
    }
  };

  const handleEditar = (item: Fechamento) => {
    setEditingId(item.fechamentoid);
    setFormData({
      mesreferencia: item.mesreferencia ? item.mesreferencia.split('T')[0] : '',
      energiacompensada: String(item.energiacompensada),
      valorrecebido: String(item.valorrecebido),
      valorpago: String(item.valorpago),
      spread: String(item.spread),
      arquivo: null, recibo: null,
      arquivourl_existente: item.arquivourl || null,
      recibourl_existente: item.recibourl || null
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
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-lg">{editingId ? 'Editar' : 'Novo'}</h3>
            <button onClick={() => setShowForm(false)}><X/></button>
          </div>
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input required type="date" className="border rounded p-2" value={formData.mesreferencia} onChange={e => setFormData({...formData, mesreferencia: e.target.value})} title="Mês Referência" />
            <input required type="number" placeholder="Energia (kWh)" className="border rounded p-2" value={formData.energiacompensada} onChange={e => setFormData({...formData, energiacompensada: e.target.value})} />
            <input required type="number" step="0.01" placeholder="R$ Recebido" className="border rounded p-2" value={formData.valorrecebido} onChange={e => setFormData({...formData, valorrecebido: e.target.value})} />
            <input required type="number" step="0.01" placeholder="R$ Pago" className="border rounded p-2" value={formData.valorpago} onChange={e => setFormData({...formData, valorpago: e.target.value})} />
            
            <div className="lg:col-span-2 border p-2 rounded border-dashed">
              <label className="block text-sm mb-1">Fatura/Planilha</label>
              {formData.arquivourl_existente ? (
                <span className="text-green-600 text-sm flex gap-2 items-center">
                  <CheckCircle size={16}/> Anexado 
                  <button type="button" onClick={() => setFormData({...formData, arquivourl_existente: null})} className="text-red-500 font-bold ml-2 p-1 hover:bg-red-50 rounded"><X size={14}/></button>
                </span>
              ) : (
                <input type="file" onChange={e => setFormData({...formData, arquivo: e.target.files?.[0] || null})} />
              )}
            </div>

            <div className="lg:col-span-2 border p-2 rounded border-dashed">
              <label className="block text-sm mb-1">Comprovante</label>
              {formData.recibourl_existente ? (
                <span className="text-green-600 text-sm flex gap-2 items-center">
                  <CheckCircle size={16}/> Anexado 
                  {/* AQUI ESTAVA O ERRO: O botão de remover estava tentando ler 'e.target.files' */}
                  <button type="button" onClick={() => setFormData({...formData, recibourl_existente: null})} className="text-red-500 font-bold ml-2 p-1 hover:bg-red-50 rounded"><X size={14}/></button>
                </span>
              ) : (
                <input type="file" onChange={e => setFormData({...formData, recibo: e.target.files?.[0] || null})} />
              )}
            </div>

            <div className="lg:col-span-4 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded">{uploading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4">Mês</th><th className="p-4">Energia</th><th className="p-4">Recebido</th><th className="p-4">Pago</th><th className="p-4">Ações</th></tr>
          </thead>
          <tbody>
            {fechamentos.map(f => (
              <tr key={f.fechamentoid} className="border-b hover:bg-gray-50">
                <td className="p-4">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="p-4">{f.energiacompensada} kWh</td>
                <td className="p-4 text-green-600">R$ {Number(f.valorrecebido).toFixed(2)}</td>
                <td className="p-4 text-red-600">R$ {Number(f.valorpago).toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                  <div className="flex gap-2 mr-4">
                    {f.arquivourl && <a href={f.arquivourl} target="_blank" title="Fatura"><FileText size={18} className="text-blue-400"/></a>}
                    {f.recibourl && <a href={f.recibourl} target="_blank" title="Recibo"><CheckCircle size={18} className="text-green-400"/></a>}
                  </div>
                  <button onClick={() => handleEditar(f)} className="text-blue-600"><Edit2 size={16}/></button>
                  <button onClick={() => handleExcluir(f.fechamentoid)} className="text-red-600"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {!loading && fechamentos.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
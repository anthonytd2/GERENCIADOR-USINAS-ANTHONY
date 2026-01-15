import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// Se der erro nesta linha, verifique se o arquivo existe em src/lib/supabaseClient.ts
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
  
  // Estados para guardar os dados
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Estados do formulário
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

  // 1. CARREGAR DADOS (Busca do servidor)
  const carregarDados = async () => {
    try {
      setLoading(true);
      const dados = await api.fechamentos.list(Number(id));
      setFechamentos(dados || []);
    } catch (e: any) {
      console.error("Erro ao carregar:", e);
      // Só mostra alerta se for um erro real, ignora erros de conexão temporários
      if (e.message && !e.message.includes('JSON')) {
         alert('Aviso: Não foi possível carregar o histórico financeiro no momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  // 2. CÁLCULO AUTOMÁTICO (Onde a mágica acontece)
  // Sempre que 'recebido' ou 'pago' muda, recalculamos o spread
  useEffect(() => {
    const recebido = parseFloat(formData.valorrecebido) || 0;
    const pago = parseFloat(formData.valorpago) || 0;
    // Spread = O que entrou - O que saiu
    setFormData(prev => ({ ...prev, spread: (recebido - pago).toFixed(2) }));
  }, [formData.valorrecebido, formData.valorpago]);

  // 3. UPLOAD DE ARQUIVOS
  const uploadArquivo = async (file: File, bucket: string) => {
    const nomeLimpo = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(nomeLimpo, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(nomeLimpo);
    return data.publicUrl;
  };

  // 4. SALVAR (Novo ou Editar)
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let urlArq = formData.arquivourl_existente;
      let urlRec = formData.recibourl_existente;

      // Se selecionou arquivo novo, faz upload
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

      if (editingId) {
        await api.fechamentos.update(editingId, payload);
      } else {
        await api.fechamentos.create(payload);
      }

      // Limpa e recarrega
      setShowForm(false);
      setEditingId(null);
      setFormData({ mesreferencia: '', energiacompensada: '', valorrecebido: '', valorpago: '', spread: '', arquivo: null, recibo: null, arquivourl_existente: null, recibourl_existente: null });
      carregarDados();
      alert('Salvo com sucesso!');

    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message || 'Verifique sua conexão'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (fid: number) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await api.fechamentos.delete(fid);
        carregarDados();
      } catch (e) {
        alert('Erro ao excluir.');
      }
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
      arquivo: null, 
      recibo: null,
      arquivourl_existente: item.arquivourl || null,
      recibourl_existente: item.recibourl || null
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={`/vinculos/${id}`} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Histórico Financeiro</h1>
            <p className="text-sm text-gray-500">Gerenciamento de faturas e pagamentos</p>
          </div>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 shadow-md transition-all"
          >
            <DollarSign size={20}/> Novo Lançamento
          </button>
        )}
      </div>

      {/* FORMULÁRIO DE CADASTRO */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in">
          <div className="flex justify-between mb-6 border-b pb-2">
            <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
              {editingId ? <Edit2 size={18}/> : <DollarSign size={18}/>} 
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500"><X/></button>
          </div>

          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Campos de Dados */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mês Referência</label>
              <input required type="date" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.mesreferencia} onChange={e => setFormData({...formData, mesreferencia: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Energia (kWh)</label>
              <input required type="number" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="0" value={formData.energiacompensada} onChange={e => setFormData({...formData, energiacompensada: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-green-600 uppercase mb-1">Valor Recebido (R$)</label>
              <input required type="number" step="0.01" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none font-medium text-green-700" 
                placeholder="0.00" value={formData.valorrecebido} onChange={e => setFormData({...formData, valorrecebido: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-red-600 uppercase mb-1">Valor Pago (R$)</label>
              <input required type="number" step="0.01" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none font-medium text-red-700" 
                placeholder="0.00" value={formData.valorpago} onChange={e => setFormData({...formData, valorpago: e.target.value})} />
            </div>

            {/* Spread Automático */}
            <div className="lg:col-span-4 bg-blue-50 p-3 rounded-lg flex justify-between items-center border border-blue-100">
              <span className="text-sm font-bold text-blue-800">Resultado (Spread):</span>
              <span className="text-lg font-bold text-blue-900">R$ {formData.spread || '0.00'}</span>
            </div>

            {/* Uploads */}
            <div className="lg:col-span-2 border p-3 rounded-lg border-dashed bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">📄 Fatura / Planilha</label>
              {formData.arquivourl_existente ? (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-green-600 text-xs flex gap-1 items-center"><CheckCircle size={14}/> Arquivo salvo</span>
                  <button type="button" onClick={() => setFormData({...formData, arquivourl_existente: null})} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                </div>
              ) : (
                <input type="file" className="text-sm w-full" onChange={e => setFormData({...formData, arquivo: e.target.files?.[0] || null})} />
              )}
            </div>

            <div className="lg:col-span-2 border p-3 rounded-lg border-dashed bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">🧾 Comprovante</label>
              {formData.recibourl_existente ? (
                <div className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-green-600 text-xs flex gap-1 items-center"><CheckCircle size={14}/> Arquivo salvo</span>
                  <button type="button" onClick={() => setFormData({...formData, recibourl_existente: null})} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                </div>
              ) : (
                <input type="file" className="text-sm w-full" onChange={e => setFormData({...formData, recibo: e.target.files?.[0] || null})} />
              )}
            </div>

            {/* Botões de Ação */}
            <div className="lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium">
                {uploading ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABELA DE DADOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-600 font-semibold uppercase text-xs">
            <tr>
              <th className="p-4">Mês/Ano</th>
              <th className="p-4">Energia</th>
              <th className="p-4 text-green-700">Recebido</th>
              <th className="p-4 text-red-700">Pago</th>
              <th className="p-4 text-blue-700">Spread</th>
              <th className="p-4 text-center">Docs</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fechamentos.map(f => (
              <tr key={f.fechamentoid} className="hover:bg-blue-50 transition-colors">
                <td className="p-4 font-medium">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="p-4">{f.energiacompensada} kWh</td>
                <td className="p-4 text-green-600 font-medium">R$ {Number(f.valorrecebido).toFixed(2)}</td>
                <td className="p-4 text-red-600 font-medium">R$ {Number(f.valorpago).toFixed(2)}</td>
                <td className="p-4 text-blue-600 font-bold bg-blue-50/30">R$ {Number(f.spread).toFixed(2)}</td>
                <td className="p-4 flex justify-center gap-2">
                  {f.arquivourl ? <a href={f.arquivourl} target="_blank" className="text-blue-400 hover:text-blue-600" title="Ver Fatura"><FileText size={18}/></a> : <span className="text-gray-300">-</span>}
                  {f.recibourl ? <a href={f.recibourl} target="_blank" className="text-green-400 hover:text-green-600" title="Ver Comprovante"><CheckCircle size={18}/></a> : <span className="text-gray-300">-</span>}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditar(f)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16}/></button>
                    <button onClick={() => handleExcluir(f.fechamentoid)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && fechamentos.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum registro encontrado. Clique em "Novo Lançamento" para começar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
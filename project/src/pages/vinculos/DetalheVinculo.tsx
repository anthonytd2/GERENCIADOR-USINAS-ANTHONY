// src/pages/vinculos/DetalheVinculo.tsx

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { createClient } from '@supabase/supabase-js';

// Ícones
import { 
  ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, 
  Edit2, Save, X, Calendar, Zap, TrendingUp, CheckCircle, User
} from 'lucide-react';

// Configuração do Supabase para Upload (Cliente)
// Se você já tem configurado em src/lib/supabaseClient.ts, importe de lá.
// Caso contrário, usamos as variáveis de ambiente.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

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

interface VinculoDetalhado {
  id: number;
  Percentual: number;
  Observacao: string;
  DataInicio: string;
  status_nome: string;
  // Ajuste os nomes conforme sua API retorna (minúsculo ou maiúsculo)
  nome_consumidor?: string; 
  documento_consumidor?: string;
  nome_proprietario?: string; // Usina
  consumidor?: { Nome: string; Documento: string; }; // Caso venha aninhado
  usina?: { NomeProprietario: string; Nome: string; }; // Caso venha aninhado
  status?: { Descricao: string; };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  
  // Estados de Dados
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Estados do Formulário
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

  // CARREGAR DADOS
  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // 1. Busca Vínculo
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);

      // 2. Busca Fechamentos (Histórico)
      try {
        const dadosFechamentos = await api.fechamentos.list(Number(id));
        setFechamentos(dadosFechamentos || []);
      } catch (e) {
        console.error("Erro ao buscar fechamentos:", e);
        setFechamentos([]);
      }

    } catch (error) {
      console.error(error);
      alert('Erro ao carregar detalhes do vínculo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  // CÁLCULO AUTOMÁTICO DO SPREAD
  useEffect(() => {
    const recebido = parseFloat(formData.valorrecebido) || 0;
    const pago = parseFloat(formData.valorpago) || 0;
    if (formData.valorrecebido || formData.valorpago) {
      setFormData(prev => ({ ...prev, spread: (recebido - pago).toFixed(2) }));
    }
  }, [formData.valorrecebido, formData.valorpago]);

  // UPLOAD DE ARQUIVO (Storage)
  const uploadArquivo = async (file: File, bucketName: string) => {
    const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeLimpo}`;
    
    const { error } = await supabaseClient.storage.from(bucketName).upload(nomeArquivo, file);
    if (error) throw error;
    
    const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(nomeArquivo);
    return data.publicUrl;
  };

  // PREPARAR FORMULÁRIO (EDITAR)
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

  // SALVAR (CRIAR OU ATUALIZAR)
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalPlanilhaUrl = formData.arquivourl_existente;
      let finalReciboUrl = formData.recibourl_existente;

      if (formData.arquivo) {
        finalPlanilhaUrl = await uploadArquivo(formData.arquivo, 'documentos');
      }
      if (formData.recibo) {
        finalReciboUrl = await uploadArquivo(formData.recibo, 'comprovantes');
      }

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

      if (editingId) {
        await api.fechamentos.update(editingId, payload);
      } else {
        await api.fechamentos.create(payload);
      }

      handleCancelar();
      carregarDados();
      alert('Salvo com sucesso!');

    } catch (error) {
      console.error(error);
      alert('Erro ao salvar.');
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (fechamentoId: number) => {
    if (confirm('Tem certeza que deseja excluir?')) {
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

  // --- RENDERIZAÇÃO ---

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando informações...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  // Helpers para exibir dados (tenta pegar do objeto aninhado ou direto)
  const nomeConsumidor = vinculo.consumidor?.Nome || vinculo.nome_consumidor || 'N/A';
  const docConsumidor = vinculo.consumidor?.Documento || vinculo.documento_consumidor || '-';
  const nomeUsina = vinculo.usina?.NomeProprietario || vinculo.nome_proprietario || 'N/A';
  const statusDesc = vinculo.status?.Descricao || vinculo.status_nome || 'Ativo';

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      
      {/* HEADER E BOTÃO DE VOLTAR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vinculos" className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm bg-gray-50">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-blue-600">#{vinculo.id}</span>
              <span>•</span>
              <span>{nomeConsumidor}</span>
            </div>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL: LANÇAR MÊS */}
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all"
          >
            <DollarSign size={20} /> Lançar Mês
          </button>
        )}
      </div>

      {/* CARDS DE INFORMAÇÃO (O que você queria manter) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Consumidor */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <User size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <User size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Consumidor</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 line-clamp-1" title={nomeConsumidor}>
            {nomeConsumidor}
          </p>
          <p className="text-sm text-gray-500">{docConsumidor}</p>
        </div>

        {/* Card Usina */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
              <Zap size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Usina Geradora</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 line-clamp-1" title={nomeUsina}>
            {nomeUsina}
          </p>
          <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            {vinculo.Percentual}% participação
          </span>
        </div>

        {/* Card Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-gray-700">Status</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {statusDesc}
          </p>
          <p className="text-sm text-gray-400">Desde {new Date(vinculo.DataInicio).toLocaleDateString()}</p>
        </div>

      </div>

      {/* FORMULÁRIO (Aparece ao clicar em Lançar Mês) */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-md p-6 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 className="text-blue-600" size={20}/> : <DollarSign className="text-green-600" size={20}/>}
              {editingId ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
            </h3>
            <button onClick={handleCancelar} className="text-gray-400 hover:text-gray-600">
              <X size={24}/>
            </button>
          </div>

          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mês Ref.</label>
              <input required type="date" className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
                value={formData.mesreferencia} onChange={e => setFormData({...formData, mesreferencia: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Energia (kWh)</label>
              <input required type="number" className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.energiacompensada} onChange={e => setFormData({...formData, energiacompensada: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Recebido (R$)</label>
              <input required type="number" step="0.01" className="w-full border-gray-200 rounded-lg text-green-700 font-semibold"
                value={formData.valorrecebido} onChange={e => setFormData({...formData, valorrecebido: e.target.value})} />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Pago (R$)</label>
              <input required type="number" step="0.01" className="w-full border-gray-200 rounded-lg text-red-700 font-semibold"
                value={formData.valorpago} onChange={e => setFormData({...formData, valorpago: e.target.value})} />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Spread (Lucro)</label>
              <input readOnly type="number" className="w-full bg-gray-100 border-gray-200 rounded-lg text-blue-700 font-bold cursor-not-allowed"
                value={formData.spread} />
            </div>

            {/* Uploads */}
            <div className="lg:col-span-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-blue-500"/> Planilha / Fatura
              </label>
              {formData.arquivourl_existente ? (
                <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-100 shadow-sm">
                  <span className="text-sm text-green-600 flex items-center gap-2"><CheckCircle size={16}/> Arquivo Anexado</span>
                  <button type="button" onClick={removerArquivoExistente} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={18}/></button>
                </div>
              ) : (
                <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                  onChange={e => setFormData({...formData, arquivo: e.target.files ? e.target.files[0] : null})} />
              )}
            </div>

            <div className="lg:col-span-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Upload size={16} className="text-green-500"/> Comprovante / Recibo
              </label>
              {formData.recibourl_existente ? (
                <div className="flex items-center justify-between bg-white p-3 rounded border border-green-100 shadow-sm">
                   <span className="text-sm text-green-600 flex items-center gap-2"><CheckCircle size={16}/> Recibo Anexado</span>
                  <button type="button" onClick={removerReciboExistente} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={18}/></button>
                </div>
              ) : (
                <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
                  onChange={e => setFormData({...formData, recibo: e.target.files ? e.target.files[0] : null})} />
              )}
            </div>

            <div className="lg:col-span-6 flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={handleCancelar} className="px-6 py-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancelar</button>
              <button type="submit" disabled={uploading} className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 shadow-md font-medium ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Save size={18} /> {uploading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABELA DE HISTÓRICO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center gap-2"><Calendar size={18}/> Histórico Financeiro</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Mês/Ano</th>
                <th className="px-6 py-4">Energia</th>
                <th className="px-6 py-4">Recebido</th>
                <th className="px-6 py-4">Pago</th>
                <th className="px-6 py-4">Spread</th>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fechamentos.map((f) => (
                <tr key={f.fechamentoid} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                    {f.mesreferencia ? new Date(f.mesreferencia).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{f.energiacompensada} kWh</td>
                  <td className="px-6 py-4 text-green-600 font-medium">R$ {Number(f.valorrecebido).toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-600 font-medium">R$ {Number(f.valorpago).toFixed(2)}</td>
                  <td className="px-6 py-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-bold">R$ {Number(f.spread).toFixed(2)}</span></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {f.arquivourl ? <a href={f.arquivourl} target="_blank" className="text-gray-400 hover:text-blue-600 p-1" title="Ver Planilha"><FileText size={18}/></a> : <span className="text-gray-200">-</span>}
                      {f.recibourl ? <a href={f.recibourl} target="_blank" className="text-gray-400 hover:text-green-600 p-1" title="Ver Recibo"><Download size={18}/></a> : <span className="text-gray-200">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditar(f)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar"><Edit2 size={16}/></button>
                      <button onClick={() => handleExcluir(f.fechamentoid)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Excluir"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fechamentos.length === 0 && <div className="p-8 text-center text-gray-400">Nenhum registro encontrado. Clique em "Lançar Mês" para começar.</div>}
        </div>
      </div>

    </div>
  );
}
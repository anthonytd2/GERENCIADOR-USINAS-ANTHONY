import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
// CORREÇÃO: Importamos 'supabaseClient' e usamos 'as supabase' para manter a compatibilidade
import { supabaseClient as supabase } from '../../lib/supabaseClient'; 
import { ArrowLeft, FileText, Upload, Trash2, DollarSign, Download } from 'lucide-react';

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
  consumidor?: { Nome: string; Documento: string; };
  usina?: { NomeProprietario: string; Nome: string; };
  status?: { Descricao: string; };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [novoFechamento, setNovoFechamento] = useState({
    mesreferencia: '',
    energiacompensada: '',
    valorrecebido: '',
    valorpago: '',
    spread: '',
    arquivo: null as File | null,
    recibo: null as File | null
  });

  // --- CÁLCULO AUTOMÁTICO DO SPREAD ---
  useEffect(() => {
    const recebido = parseFloat(novoFechamento.valorrecebido) || 0;
    const pago = parseFloat(novoFechamento.valorpago) || 0;
    
    if (novoFechamento.valorrecebido || novoFechamento.valorpago) {
      setNovoFechamento(prev => ({
        ...prev,
        spread: (recebido - pago).toFixed(2)
      }));
    }
  }, [novoFechamento.valorrecebido, novoFechamento.valorpago]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);
      try {
        const dadosFechamentos = await api.fechamentos.list(Number(id));
        setFechamentos(dadosFechamentos || []);
      } catch (e) { setFechamentos([]); }
    } catch (error) { alert('Erro ao carregar detalhes.'); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) carregarDados(); }, [id]);

  // --- FUNÇÃO DE UPLOAD ---
  const uploadArquivo = async (file: File, bucketName: string) => {
    // Limpa o nome do arquivo para evitar erros de URL
    const nomeLimpo = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '_');
    const nomeArquivo = `${Date.now()}_${nomeLimpo}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(nomeArquivo, file);
    
    if (error) throw error;
    
    const { data: publicUrl } = supabase.storage
      .from(bucketName)
      .getPublicUrl(nomeArquivo);
      
    return publicUrl.publicUrl;
  };

  const handleSalvarFechamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let planilhaUrl = '';
      let reciboUrl = '';

      // Upload Planilha
      if (novoFechamento.arquivo) {
        // ATENÇÃO: Verifique se o bucket no Supabase chama-se "documentos" ou "docuementos" (como mencionou antes)
        planilhaUrl = await uploadArquivo(novoFechamento.arquivo, 'documentos'); 
      }
      
      // Upload Recibo
      if (novoFechamento.recibo) {
        reciboUrl = await uploadArquivo(novoFechamento.recibo, 'comprovantes');
      }

      await api.fechamentos.create({
        VinculoID: Number(id),
        MesReferencia: novoFechamento.mesreferencia,
        EnergiaCompensada: Number(novoFechamento.energiacompensada),
        ValorRecebido: Number(novoFechamento.valorrecebido),
        ValorPago: Number(novoFechamento.valorpago),
        Spread: Number(novoFechamento.spread),
        ArquivoURL: planilhaUrl,
        ReciboURL: reciboUrl
      });

      setShowForm(false);
      setNovoFechamento({ mesreferencia: '', energiacompensada: '', valorrecebido: '', valorpago: '', spread: '', arquivo: null, recibo: null });
      carregarDados();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar. Verifique se os buckets "documentos" e "comprovantes" existem no Supabase Storage e são Públicos.');
    } finally {
      setUploading(false);
    }
  };

  const handleExcluirFechamento = async (fechamentoId: number) => {
    if (confirm('Excluir este fechamento?')) {
      try { await api.fechamentos.delete(fechamentoId); carregarDados(); } catch (e) { alert('Erro ao excluir'); }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/vinculos" className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo #{vinculo.id}</h1>
          <p className="text-gray-500">Gerencie os fechamentos e recibos deste contrato.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Consumidor</h3>
          <p className="text-lg font-semibold text-gray-900 mt-1">{vinculo.consumidor?.Nome || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Usina</h3>
          <p className="text-lg font-semibold text-gray-900 mt-1">{vinculo.usina?.NomeProprietario || vinculo.usina?.Nome || 'N/A'}</p>
          <p className="text-sm text-gray-500">Percentual: {vinculo.Percentual}%</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Status</h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{vinculo.status?.Descricao || vinculo.status_nome || 'N/A'}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-bold text-gray-800">Fechamentos Mensais</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <DollarSign size={18} /> Adicionar Mês
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSalvarFechamento} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Mês (Data)</label>
            <input required type="date" className="w-full border rounded p-2" value={novoFechamento.mesreferencia} onChange={e => setNovoFechamento({...novoFechamento, mesreferencia: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Energia (kWh)</label>
            <input required type="number" placeholder="0" className="w-full border rounded p-2" value={novoFechamento.energiacompensada} onChange={e => setNovoFechamento({...novoFechamento, energiacompensada: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Recebido (R$)</label>
            <input required type="number" step="0.01" className="w-full border rounded p-2" value={novoFechamento.valorrecebido} onChange={e => setNovoFechamento({...novoFechamento, valorrecebido: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Pago (R$)</label>
            <input required type="number" step="0.01" className="w-full border rounded p-2" value={novoFechamento.valorpago} onChange={e => setNovoFechamento({...novoFechamento, valorpago: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Spread (R$)</label>
            <input readOnly type="number" className="w-full border rounded p-2 bg-gray-200 font-bold text-blue-700 cursor-not-allowed" value={novoFechamento.spread} />
          </div>
          
          <div className="md:col-span-3 lg:col-span-3 border-t pt-4 mt-2 border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Upload size={14}/> Anexar Planilha</label>
            <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              onChange={e => setNovoFechamento({...novoFechamento, arquivo: e.target.files ? e.target.files[0] : null})} />
            <p className="text-[10px] text-gray-400 mt-1">Vai para o bucket "documentos"</p>
          </div>
          <div className="md:col-span-3 lg:col-span-2 border-t pt-4 mt-2 border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Upload size={14}/> Anexar Comprovante</label>
            <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              onChange={e => setNovoFechamento({...novoFechamento, recibo: e.target.files ? e.target.files[0] : null})} />
            <p className="text-[10px] text-gray-400 mt-1">Vai para o bucket "comprovantes"</p>
          </div>

          <div className="md:col-span-6 lg:col-span-1 flex gap-2 w-full pt-4">
            <button type="submit" disabled={uploading} className={`flex-1 text-white p-2 rounded flex justify-center items-center shadow-md ${uploading ? 'bg-gray-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}>
              {uploading ? 'Enviando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Mês</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Energia</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Financeiro</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Spread</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Anexos</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fechamentos.map((f) => (
              <tr key={f.fechamentoid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}</td>
                <td className="px-6 py-4">{f.energiacompensada} kWh</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 flex justify-between w-24">Recebido: <b className="text-green-600">R${f.valorrecebido}</b></span>
                    <span className="text-xs text-gray-500 flex justify-between w-24">Pago: <b className="text-red-600">R${f.valorpago}</b></span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold border border-blue-100">R$ {f.spread}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    {f.arquivourl ? (
                      <a href={f.arquivourl} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-800 flex items-center gap-1 text-xs font-medium" title="Baixar Planilha">
                        <FileText size={16} /> Planilha
                      </a>
                    ) : <span className="text-gray-300 text-xs">-</span>}
                    
                    {f.recibourl ? (
                      <a href={f.recibourl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs font-medium" title="Baixar Recibo">
                        <Download size={16} /> Recibo
                      </a>
                    ) : <span className="text-gray-300 text-xs">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleExcluirFechamento(f.fechamentoid)} className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
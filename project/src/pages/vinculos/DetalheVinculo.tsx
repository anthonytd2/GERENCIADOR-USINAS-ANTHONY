import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, Plus, Save, X, FileSpreadsheet, Paperclip, CheckCircle } from 'lucide-react';

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<any>(null);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    MesReferencia: '',
    EnergiaCompensada: '',
    ValorRecebido: '',
    ValorPago: '',
    Spread: '',
    ArquivoURL: '' 
  });

  const loadData = async () => {
    if (id) {
      try {
        const v = await api.vinculos.get(Number(id));
        setVinculo(v);
        // O erro 500 acontecia aqui, agora deve funcionar
        const r = await api.fechamentos.list(Number(id));
        setRelatorios(r || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCalcSpread = (recebido: string, pago: string) => {
    const r = parseFloat(recebido) || 0;
    const p = parseFloat(pago) || 0;
    setForm(prev => ({ ...prev, ValorRecebido: recebido, ValorPago: pago, Spread: (r - p).toFixed(2) }));
  };

  const handleFileUpload = async (e: any) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      const fileName = `${id}_${Date.now()}_${file.name}`;
      
      const { error } = await supabaseClient.storage
        .from('comprovantes')
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabaseClient.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      setForm(prev => ({ ...prev, ArquivoURL: publicUrlData.publicUrl }));
      alert("Arquivo anexado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fechamentos.create({ VinculoID: Number(id), ...form });
      setShowModal(false);
      setForm({ MesReferencia: '', EnergiaCompensada: '', ValorRecebido: '', ValorPago: '', Spread: '', ArquivoURL: '' });
      loadData();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar relatório');
    }
  };

  const handleDeleteRelatorio = async (relatorioId: number) => {
    if (!confirm('Excluir este registro?')) return;
    await api.fechamentos.delete(relatorioId);
    loadData();
  };

  const handleDeleteVinculo = async () => {
    if (!confirm('Excluir vínculo?')) return;
    await api.vinculos.delete(Number(id));
    navigate('/vinculos');
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!vinculo) return <div className="p-8 text-center">Não encontrado</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <Link to="/vinculos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          <Link to={`/vinculos/${id}/editar`} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
            <Edit className="w-4 h-4" />
          </Link>
          <button onClick={handleDeleteVinculo} className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        {/* CORREÇÃO: Acesso usando minúsculo (consumidores, usinas) */}
        <h1 className="text-2xl font-bold text-[#0B1E3F]">
          {vinculo.consumidores?.Nome || vinculo.consumidores?.nome || 'Consumidor'}
        </h1>
        <p className="text-gray-500">
          Usina: {vinculo.usinas?.NomeProprietario || vinculo.usinas?.nomeproprietario || 'N/A'}
        </p>
      </div>

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-[#0B1E3F] flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-blue-600" /> Histórico Financeiro
        </h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mês</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Energia</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Recebido</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase">Pago</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-600 uppercase">Lucro</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Anexo</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {relatorios.map((rel) => (
              <tr key={rel.fechamentoid || rel.FechamentoID} className="hover:bg-gray-50">
                {/* CORREÇÃO: Acesso usando chaves minúsculas retornadas pelo banco */}
                <td className="px-6 py-4 font-medium">{rel.mesreferencia || rel.MesReferencia}</td>
                <td className="px-6 py-4">{rel.energiacompensada || rel.EnergiaCompensada} kWh</td>
                <td className="px-6 py-4 text-blue-700">R$ {rel.valorrecebido || rel.ValorRecebido}</td>
                <td className="px-6 py-4 text-red-700">R$ {rel.valorpago || rel.ValorPago}</td>
                <td className="px-6 py-4 text-green-700 font-bold">R$ {rel.spread || rel.Spread}</td>
                
                <td className="px-6 py-4 text-right">
                  {(rel.arquivourl || rel.ArquivoURL) ? (
                    <a href={rel.arquivourl || rel.ArquivoURL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium">
                      <FileSpreadsheet className="w-4 h-4" /> Ver Planilha
                    </a>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>

                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteRelatorio(rel.fechamentoid || rel.FechamentoID)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#0B1E3F]">
                <Calendar className="w-5 h-5 text-blue-600" /> Novo Lançamento
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                  <input type="month" required className="w-full rounded-lg border-gray-300"
                    value={form.MesReferencia} onChange={e => setForm({...form, MesReferencia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energia (kWh)</label>
                  <input type="number" required className="w-full rounded-lg border-gray-300"
                    value={form.EnergiaCompensada} onChange={e => setForm({...form, EnergiaCompensada: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-1">Recebido</label>
                  <input type="number" step="0.01" required className="w-full rounded-lg border-blue-200"
                    value={form.ValorRecebido} onChange={e => handleCalcSpread(e.target.value, form.ValorPago)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-700 mb-1">Pago</label>
                  <input type="number" step="0.01" required className="w-full rounded-lg border-red-200"
                    value={form.ValorPago} onChange={e => handleCalcSpread(form.ValorRecebido, e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anexar Planilha (Memória de Cálculo)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer bg-white border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm truncate">{uploading ? 'Enviando...' : (form.ArquivoURL ? 'Arquivo Anexado!' : 'Escolher Arquivo')}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.xls,.xlsx,.csv" />
                  </label>
                  {form.ArquivoURL && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
                {form.ArquivoURL && <p className="text-xs text-green-600 mt-1">Pronto para salvar.</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, Plus, Save, X, FileSpreadsheet, Paperclip, CheckCircle, FileText, Info } from 'lucide-react';

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<any>(null);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal e Edição
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Uploads
  const [uploadingPlanilha, setUploadingPlanilha] = useState(false);
  const [uploadingRecibo, setUploadingRecibo] = useState(false);

  const [form, setForm] = useState({
    MesReferencia: '',
    EnergiaCompensada: '',
    ValorRecebido: '',
    ValorPago: '',
    Spread: '',
    ArquivoURL: '', 
    ReciboURL: ''   
  });

  const loadData = async () => {
    if (id) {
      try {
        const v = await api.vinculos.get(Number(id));
        setVinculo(v);
        const r = await api.fechamentos.list(Number(id));
        setRelatorios(Array.isArray(r) ? r : []);
      } catch (err) {
        console.error(err);
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

  const handleUpload = async (e: any, type: 'planilha' | 'recibo') => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'planilha') setUploadingPlanilha(true);
    else setUploadingRecibo(true);

    try {
      const fileName = `${type}_${id}_${Date.now()}_${file.name}`;
      const { error } = await supabaseClient.storage.from('comprovantes').upload(fileName, file);
      if (error) throw error;
      
      const { data } = supabaseClient.storage.from('comprovantes').getPublicUrl(fileName);
      
      if (type === 'planilha') setForm(prev => ({ ...prev, ArquivoURL: data.publicUrl }));
      else setForm(prev => ({ ...prev, ReciboURL: data.publicUrl }));
      
    } catch (error) {
      alert('Erro no upload.');
    } finally {
      setUploadingPlanilha(false);
      setUploadingRecibo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.fechamentos.update(editingId, form);
      } else {
        await api.fechamentos.create({ VinculoID: Number(id), ...form });
      }
      closeModal();
      loadData();
    } catch (error) {
      alert('Erro ao salvar.');
    }
  };

  const handleEditRelatorio = (rel: any) => {
    setEditingId(rel.fechamentoid || rel.FechamentoID);
    setForm({
      MesReferencia: rel.mesreferencia || rel.MesReferencia,
      EnergiaCompensada: rel.energiacompensada || rel.EnergiaCompensada,
      ValorRecebido: rel.valorrecebido || rel.ValorRecebido,
      ValorPago: rel.valorpago || rel.ValorPago,
      Spread: rel.spread || rel.Spread,
      ArquivoURL: rel.arquivourl || rel.ArquivoURL || '',
      ReciboURL: rel.recibourl || rel.ReciboURL || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ MesReferencia: '', EnergiaCompensada: '', ValorRecebido: '', ValorPago: '', Spread: '', ArquivoURL: '', ReciboURL: '' });
  };

  const handleDeleteRelatorio = async (relatorioId: number) => {
    if (!confirm('Excluir?')) return;
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
          <Link to={`/vinculos/${id}/editar`} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"><Edit className="w-4 h-4" /></Link>
          <button onClick={handleDeleteVinculo} className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* CARTÃO DO CONSUMIDOR E USINA COM OBSERVAÇÃO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[#0B1E3F]">
                {vinculo.consumidores?.Nome || vinculo.consumidores?.nome || 'Consumidor'}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                Usina: <span className="font-semibold">{vinculo.usinas?.NomeProprietario || vinculo.usinas?.nomeproprietario || 'N/A'}</span>
                </p>
                <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                    {vinculo.status?.Descricao || vinculo.status?.descricao || 'Sem Status'}
                </div>
            </div>
        </div>

        {/* NOVA ÁREA DE OBSERVAÇÃO */}
        {(vinculo.observacao || vinculo.Observacao) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4" /> Observações Importantes
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {vinculo.observacao || vinculo.Observacao}
                </div>
            </div>
        )}
      </div>

      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-[#0B1E3F] flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-blue-600" /> Histórico Financeiro Completo
        </h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mês Ref.</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Energia (kWh)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Recebido</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase">Pago</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-600 uppercase">Lucro</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Documentos</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {relatorios.map((rel) => (
              <tr key={rel.fechamentoid || rel.FechamentoID} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{rel.mesreferencia || rel.MesReferencia}</td>
                <td className="px-6 py-4 text-gray-600">{rel.energiacompensada || rel.EnergiaCompensada}</td>
                <td className="px-6 py-4 text-blue-700 font-medium">R$ {rel.valorrecebido || rel.ValorRecebido}</td>
                <td className="px-6 py-4 text-red-700 font-medium">R$ {rel.valorpago || rel.ValorPago}</td>
                <td className="px-6 py-4 text-green-700 font-bold bg-green-50/50 rounded-lg">R$ {rel.spread || rel.Spread}</td>
                
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center space-x-3">
                    {(rel.arquivourl || rel.ArquivoURL) ? (
                        <a href={rel.arquivourl || rel.ArquivoURL} target="_blank" className="flex flex-col items-center group" title="Memória de Cálculo">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600 group-hover:text-blue-800" />
                        <span className="text-[10px] text-gray-500 group-hover:text-blue-800">Planilha</span>
                        </a>
                    ) : <span className="w-5 h-5"></span>}
                    
                    {(rel.recibourl || rel.ReciboURL) ? (
                        <a href={rel.recibourl || rel.ReciboURL} target="_blank" className="flex flex-col items-center group" title="Recibo de Pagamento">
                        <FileText className="w-5 h-5 text-green-600 group-hover:text-green-800" />
                        <span className="text-[10px] text-gray-500 group-hover:text-green-800">Recibo</span>
                        </a>
                    ) : <span className="w-5 h-5"></span>}
                  </div>
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEditRelatorio(rel)} className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRelatorio(rel.fechamentoid || rel.FechamentoID)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO (MANTIDO IGUAL) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-[#0B1E3F]">
                {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês de Referência</label>
                  <input type="month" required className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                    value={form.MesReferencia} onChange={e => setForm({...form, MesReferencia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energia (kWh)</label>
                  <input type="number" required className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                    value={form.EnergiaCompensada} onChange={e => setForm({...form, EnergiaCompensada: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-1">Valor Recebido (R$)</label>
                  <input type="number" step="0.01" required className="w-full rounded-lg border-blue-200 focus:ring-blue-500"
                    value={form.ValorRecebido} onChange={e => handleCalcSpread(e.target.value, form.ValorPago)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-700 mb-1">Valor Pago (R$)</label>
                  <input type="number" step="0.01" required className="w-full rounded-lg border-red-200 focus:ring-red-500"
                    value={form.ValorPago} onChange={e => handleCalcSpread(form.ValorRecebido, e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. Memória de Cálculo (Excel/PDF)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer bg-white border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm truncate">{uploadingPlanilha ? 'Enviando...' : (form.ArquivoURL ? 'Arquivo Anexado!' : 'Selecionar Planilha')}</span>
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'planilha')} disabled={uploadingPlanilha} accept=".pdf,.xls,.xlsx,.csv" />
                  </label>
                  {form.ArquivoURL && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">2. Comprovante / Recibo (IMG/PDF)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer bg-white border border-gray-300 text-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm truncate">{uploadingRecibo ? 'Enviando...' : (form.ReciboURL ? 'Arquivo Anexado!' : 'Selecionar Recibo')}</span>
                    <input type="file" className="hidden" onChange={(e) => handleUpload(e, 'recibo')} disabled={uploadingRecibo} accept=".pdf,.png,.jpg,.jpeg" />
                  </label>
                  {form.ReciboURL && <CheckCircle className="w-6 h-6 text-green-500" />}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  <Save className="w-4 h-4" /> Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, Plus, Save, X } from 'lucide-react';

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<any>(null);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Dados do formulário (baseado na sua planilha)
  const [form, setForm] = useState({
    MesReferencia: '',
    EnergiaCompensada: '',
    ValorRecebido: '',
    ValorPago: '',
    Spread: ''
  });

  const loadData = async () => {
    if (id) {
      const v = await api.vinculos.get(Number(id));
      setVinculo(v);
      const r = await api.fechamentos.list(Number(id));
      setRelatorios(r);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Função inteligente: Calcula o Spread automático quando você digita os valores
  const handleCalcSpread = (recebido: string, pago: string) => {
    const r = parseFloat(recebido) || 0;
    const p = parseFloat(pago) || 0;
    setForm(prev => ({ ...prev, ValorRecebido: recebido, ValorPago: pago, Spread: (r - p).toFixed(2) }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fechamentos.create({
        VinculoID: Number(id),
        ...form
      });
      setShowModal(false);
      setForm({ MesReferencia: '', EnergiaCompensada: '', ValorRecebido: '', ValorPago: '', Spread: '' });
      loadData();
    } catch (error) {
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
      {/* CABEÇALHO */}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{vinculo.Consumidores.Nome}</h1>
        <p className="text-gray-500">Usina: {vinculo.Usinas.NomeProprietario} | Status: {vinculo.Status.Descricao}</p>
      </div>

      {/* ÁREA DE RELATÓRIOS */}
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-blue-600" /> Relatórios Mensais
        </h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Relatório
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mês</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Energia (kWh)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Recebido (Consumidor)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase">Pago (Gerador)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-green-600 uppercase">Spread (Lucro)</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {relatorios.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum relatório lançado.</td></tr>
            ) : (
              relatorios.map((rel) => (
                <tr key={rel.FechamentoID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{rel.MesReferencia}</td>
                  <td className="px-6 py-4">{rel.EnergiaCompensada} kWh</td>
                  <td className="px-6 py-4 text-blue-700 font-medium">R$ {rel.ValorRecebido}</td>
                  <td className="px-6 py-4 text-red-700 font-medium">R$ {rel.ValorPago}</td>
                  <td className="px-6 py-4 text-green-700 font-bold bg-green-50">R$ {rel.Spread}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteRelatorio(rel.FechamentoID)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL / FORMULÁRIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Lançar Dados da Planilha
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês Referência</label>
                  <input type="month" required className="w-full rounded-lg border-gray-300"
                    value={form.MesReferencia} onChange={e => setForm({...form, MesReferencia: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energia (kWh)</label>
                  <input type="number" required placeholder="Ex: 1250" className="w-full rounded-lg border-gray-300"
                    value={form.EnergiaCompensada} onChange={e => setForm({...form, EnergiaCompensada: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-1">Recebido (Consumidor)</label>
                  <input type="number" step="0.01" required placeholder="R$ 0.00" className="w-full rounded-lg border-blue-200 focus:ring-blue-500"
                    value={form.ValorRecebido} 
                    onChange={e => handleCalcSpread(e.target.value, form.ValorPago)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-700 mb-1">Pago (Gerador)</label>
                  <input type="number" step="0.01" required placeholder="R$ 0.00" className="w-full rounded-lg border-red-200 focus:ring-red-500"
                    value={form.ValorPago} 
                    onChange={e => handleCalcSpread(form.ValorRecebido, e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-green-700 mb-1">Spread (Lucro Bionova)</label>
                <input type="number" step="0.01" required className="w-full rounded-lg border-green-200 bg-green-50 font-bold text-green-800 focus:ring-green-500"
                  value={form.Spread} 
                  onChange={e => setForm({...form, Spread: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Calculado automaticamente (Recebido - Pago), mas você pode ajustar.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  <Save className="w-4 h-4" /> Salvar Relatório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
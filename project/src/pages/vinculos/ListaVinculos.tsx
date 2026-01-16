import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Link as LinkIcon, AlertCircle, CheckCircle, Clock, XCircle, Zap, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import FormularioVinculo from './FormularioVinculo';
import Skeleton from '../../components/Skeleton';

interface Vinculo {
  id: number;
  consumidor_nome: string;
  usina_nome: string;
  status_nome: string;
  percentual: number;
  data_inicio: string;
  data_fim?: string; // Novo campo
  status_id?: number;
  consumidor_id?: number;
  usina_id?: number;
}

const ListaVinculos = () => {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vinculoEmEdicao, setVinculoEmEdicao] = useState<Vinculo | null>(null);
  const [busca, setBusca] = useState('');

  const carregarVinculos = async () => {
    setLoading(true);
    try {
      const dados = await api.vinculos.list();
      if (Array.isArray(dados)) {
        setVinculos(dados);
      } else if (dados && Array.isArray(dados.data)) {
        setVinculos(dados.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVinculos();
  }, []);

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este vínculo?')) {
      try {
        await api.vinculos.delete(id);
        carregarVinculos();
      } catch (error) {
        alert('Erro ao excluir vínculo');
      }
    }
  };

  // Lógica de Vencimento
  const verificaVencimento = (dataFim: string | undefined) => {
    if (!dataFim) return false;
    const hoje = new Date();
    const vencimento = new Date(dataFim);
    const diferencaDias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
    return diferencaDias > 0 && diferencaDias <= 30; // Vence nos próximos 30 dias
  };

  const vinculosFiltrados = vinculos.filter(v => 
    (v.consumidor_nome?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (v.usina_nome?.toLowerCase() || '').includes(busca.toLowerCase())
  );

  if (showForm) {
    return (
      <FormularioVinculo
        vinculoParaEditar={vinculoEmEdicao}
        onSalvar={() => { setShowForm(false); setVinculoEmEdicao(null); carregarVinculos(); }}
        onCancelar={() => { setShowForm(false); setVinculoEmEdicao(null); }}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Vínculos</h2>
          <p className="text-gray-500 mt-1">Gerencie as conexões entre usinas e consumidores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por consumidor ou usina..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-brand-DEFAULT focus:border-brand-DEFAULT py-2 shadow-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
             {[1,2,3].map(i => <div key={i} className="flex justify-between"><div className="flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-48" /></div><Skeleton className="h-8 w-20" /></div>)}
          </div>
        ) : vinculosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nenhum vínculo encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Consumidor</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usina Conectada</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Alocação</th>
                  <th className="px-6 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vinculosFiltrados.map((vinculo) => {
                  const estaVencendo = verificaVencimento(vinculo.data_fim);
                  
                  return (
                    <tr key={vinculo.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/vinculos/${vinculo.id}`} className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                            <LinkIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                              {vinculo.consumidor_nome || 'Sem Nome'}
                              {estaVencendo && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 animate-pulse" title="Contrato vencendo em < 30 dias">
                                  <AlertTriangle className="w-3 h-3 mr-1" /> VENCE EM BREVE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">Vínculo #{vinculo.id}</div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Zap className="w-4 h-4 text-amber-500" />
                          {vinculo.usina_nome || 'Usina não identificada'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {vinculo.percentual}%
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {(vinculo.status_nome === 'Ativo' || vinculo.status_nome === 'Em compensação') ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wide border border-emerald-200">
                            <CheckCircle className="w-3 h-3" /> {vinculo.status_nome}
                          </span>
                        ) : (vinculo.status_nome === 'Pendente' || vinculo.status_nome === 'Aguardando transferência') ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold text-xs uppercase tracking-wide border border-amber-200">
                            <Clock className="w-3 h-3" /> {vinculo.status_nome}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wide border border-slate-200">
                            <XCircle className="w-3 h-3" /> {vinculo.status_nome || 'Indefinido'}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setVinculoEmEdicao(vinculo); setShowForm(true); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleExcluir(vinculo.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaVinculos;
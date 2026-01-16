import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Link as LinkIcon, AlertCircle, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import FormularioVinculo from './FormularioVinculo';

// Interface alinhada com o Backend Otimizado
interface Vinculo {
  id: number;
  consumidor_nome: string;
  usina_nome: string; // Garante que o nome da usina apareça
  status_nome: string; // Garante que o status apareça
  percentual: number;
  data_inicio: string;
  status_id?: number;
  consumidor_id?: number;
  usina_id?: number;
}

const ListaVinculos = () => {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [vinculoEmEdicao, setVinculoEmEdicao] = useState<Vinculo | null>(null);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');

  const carregarVinculos = async () => {
    try {
      setLoading(true);
      setError('');
      // O backend otimizado já retorna os nomes prontos, não precisa fazer cruzamento aqui
      const dados = await api.vinculos.list();
      
      if (Array.isArray(dados)) {
        setVinculos(dados);
      } else if (dados && Array.isArray(dados.data)) {
        setVinculos(dados.data);
      } else {
        setVinculos([]);
      }
    } catch (error) {
      console.error('Erro ao carregar:', error);
      setError('Não foi possível carregar os vínculos.');
      setVinculos([]);
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

  // Filtro de busca simples no front (já que agora carregamos rápido)
  const vinculosFiltrados = vinculos.filter(v => 
    (v.consumidor_nome?.toLowerCase() || '').includes(busca.toLowerCase()) ||
    (v.usina_nome?.toLowerCase() || '').includes(busca.toLowerCase())
  );

  if (showForm) {
    return (
      <FormularioVinculo
        vinculoParaEditar={vinculoEmEdicao}
        onSalvar={() => {
          setShowForm(false);
          setVinculoEmEdicao(null);
          carregarVinculos();
        }}
        onCancelar={() => {
          setShowForm(false);
          setVinculoEmEdicao(null);
        }}
      />
    );
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Carregando vínculos...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Vínculos</h2>
          <p className="text-gray-500 mt-1">Gerencie as conexões entre usinas e consumidores</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 border border-red-200 shadow-sm">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* BARRA DE BUSCA */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por consumidor ou usina..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2 shadow-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {vinculosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            Nenhum vínculo encontrado.
          </div>
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
                {vinculosFiltrados.map((vinculo) => (
                  <tr key={vinculo.id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* COLUNA CONSUMIDOR - Avatar Roxo */}
                    <td className="px-6 py-4">
                      <Link to={`/vinculos/${vinculo.id}`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {vinculo.consumidor_nome || 'Sem Nome'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Vínculo #{vinculo.id}
                          </div>
                        </div>
                      </Link>
                    </td>

                    {/* COLUNA USINA - Ícone de Raio e Nome */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {vinculo.usina_nome || 'Usina não identificada'}
                      </div>
                    </td>
                    
                    {/* COLUNA PERCENTUAL - Badge azul simples */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {vinculo.percentual}%
                      </span>
                    </td>

                    {/* COLUNA STATUS - Cores Condicionais (Green/Yellow/Red) */}
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

                    {/* AÇÕES */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setVinculoEmEdicao(vinculo);
                            setShowForm(true);
                          }}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleExcluir(vinculo.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaVinculos;
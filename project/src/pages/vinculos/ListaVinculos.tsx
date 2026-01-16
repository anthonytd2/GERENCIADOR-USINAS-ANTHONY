import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import FormularioVinculo from './FormularioVinculo';

interface Vinculo {
  id: number;
  consumidor_nome: string;
  usina_nome: string;
  percentual: number;
  status_nome: string;
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

  const vinculosFiltrados = vinculos.filter(v => 
    v.consumidor_nome.toLowerCase().includes(busca.toLowerCase()) ||
    v.usina_nome.toLowerCase().includes(busca.toLowerCase())
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
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usina</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Percentual</th>
                  <th className="px-6 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vinculosFiltrados.map((vinculo) => (
                  <tr key={vinculo.id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* --- AQUI: AVATAR ROXO/ÍNDIGO PARA VÍNCULOS --- */}
                    <td className="px-6 py-4">
                      <Link 
                        to={`/vinculos/${vinculo.id}`} 
                        className="flex items-center gap-4"
                      >
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                          {vinculo.consumidor_nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {vinculo.consumidor_nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            Vínculo #{vinculo.id}
                          </div>
                        </div>
                      </Link>
                    </td>
                    {/* ---------------------------------------------- */}

                    <td className="px-6 py-4 text-gray-600">
                      {vinculo.usina_nome}
                    </td>
                    
                    <td className="px-6 py-4 text-gray-600">
                      {vinculo.percentual}%
                    </td>

                    <td className="px-6 py-4 text-center">
                      {vinculo.status_nome === 'Ativo' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs uppercase tracking-wide border border-green-200">
                          <CheckCircle className="w-3 h-3" /> Ativo
                        </span>
                      ) : vinculo.status_nome === 'Pendente' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs uppercase tracking-wide border border-yellow-200">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wide border border-gray-200">
                          <XCircle className="w-3 h-3" /> {vinculo.status_nome}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setVinculoEmEdicao(vinculo);
                            setShowForm(true);
                          }}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleExcluir(vinculo.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
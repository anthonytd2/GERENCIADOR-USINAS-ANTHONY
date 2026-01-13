import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Link as LinkIcon, AlertCircle } from 'lucide-react';
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

  const carregarVinculos = async () => {
    try {
      setLoading(true);
      setError('');
      const dados = await api.vinculos.list();
      
      // Garante que é array
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

  return (
    <div>
      {/* CABEÇALHO PADRONIZADO */}
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

      {/* BARRA DE BUSCA (Mantida a funcionalidade, visual limpo) */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar vínculos..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 py-2 shadow-sm"
        />
      </div>

      {/* TABELA PADRONIZADA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Consumidor</th>
                <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Usina</th>
                <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Percentual</th>
                <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Carregando vínculos...</td></tr>
              ) : vinculos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <LinkIcon size={48} className="text-gray-300" />
                      <p>Nenhum vínculo encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vinculos.map((vinculo) => (
                  <tr key={vinculo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`/vinculos/${vinculo.id}`} 
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {vinculo.consumidor_nome}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vinculo.usina_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vinculo.percentual}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${vinculo.status_nome === 'Ativo' ? 'bg-green-100 text-green-800' : 
                          vinculo.status_nome === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {vinculo.status_nome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setVinculoEmEdicao(vinculo);
                            setShowForm(true);
                          }}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleExcluir(vinculo.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListaVinculos;
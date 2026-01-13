import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Link as LinkIcon, AlertCircle, Eye, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import FormularioVinculo from './FormularioVinculo';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate(); // Hook para navegação

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
      console.error('Erro ao carregar vínculos:', error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Vínculos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Novo Vínculo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar vínculos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumidor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usina</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Carregando...</td></tr>
              ) : vinculos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <LinkIcon size={48} className="text-gray-300" />
                      <p>Nenhum vínculo encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                vinculos.map((vinculo) => (
                  <tr key={vinculo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vinculo.consumidor_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vinculo.usina_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vinculo.percentual}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${vinculo.status_nome === 'Ativo' ? 'bg-green-100 text-green-800' : 
                          vinculo.status_nome === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {vinculo.status_nome}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* BOTÃO VER DETALHES (RECIBOS/CÁLCULOS) */}
                        <button 
                          onClick={() => navigate(`/vinculos/${vinculo.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver Detalhes e Cálculos"
                        >
                          <FileText size={18} />
                        </button>

                        {/* BOTÃO EDITAR */}
                        <button
                          onClick={() => {
                            setVinculoEmEdicao(vinculo);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>

                        {/* BOTÃO EXCLUIR */}
                        <button 
                          onClick={() => handleExcluir(vinculo.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
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
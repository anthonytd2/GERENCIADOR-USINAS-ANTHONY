import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, User, Zap, TrendingUp, DollarSign } from 'lucide-react';

interface VinculoDetalhado {
  id: number;
  Percentual: number;
  DataInicio: string;
  status_nome: string;
  nome_consumidor?: string; documento_consumidor?: string;
  nome_proprietario?: string;
  consumidor?: { Nome: string; Documento: string; };
  usina?: { NomeProprietario: string; Nome: string; };
  status?: { Descricao: string; };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const dados = await api.vinculos.get(Number(id));
        setVinculo(dados);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) carregar();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  const nomeConsumidor = vinculo.consumidor?.Nome || vinculo.nome_consumidor || 'N/A';
  const nomeUsina = vinculo.usina?.NomeProprietario || vinculo.nome_proprietario || 'N/A';

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/vinculos" className="p-2 hover:bg-white rounded-full text-gray-600 bg-gray-50"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo #{vinculo.id}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold"><User size={20}/> Consumidor</div>
          <p className="text-lg font-bold text-gray-900">{nomeConsumidor}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-yellow-600 font-semibold"><Zap size={20}/> Usina</div>
          <p className="text-lg font-bold text-gray-900">{nomeUsina}</p>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{vinculo.Percentual}% participação</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-green-600 font-semibold"><TrendingUp size={20}/> Status</div>
          <p className="text-lg font-bold text-gray-900">{vinculo.status?.Descricao || vinculo.status_nome}</p>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Financeiro</h2>
        <p className="text-blue-600 mb-6">Gerencie faturas e recibos deste contrato.</p>
        <button 
          onClick={() => navigate(`/vinculos/${id}/financeiro`)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 mx-auto"
        >
          <DollarSign size={24} /> Acessar Histórico Financeiro
        </button>
      </div>
    </div>
  );
}
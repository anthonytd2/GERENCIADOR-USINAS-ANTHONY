import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  ArrowLeft, User, Zap, TrendingUp, DollarSign 
} from 'lucide-react';

interface VinculoDetalhado {
  id: number;
  Percentual: number;
  Observacao: string;
  DataInicio: string;
  status_nome: string;
  nome_consumidor?: string; 
  documento_consumidor?: string;
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
    const carregarDados = async () => {
      try {
        setLoading(true);
        // AQUI ESTÁ A CORREÇÃO: Buscamos APENAS o vínculo.
        // Removemos a busca de fechamentos que estava travando a tela.
        const dados = await api.vinculos.get(Number(id));
        setVinculo(dados);
      } catch (error) {
        console.error(error);
        alert('Erro ao carregar detalhes do vínculo.');
      } finally {
        setLoading(false);
      }
    };
    if (id) carregarDados();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando informações...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  const nomeConsumidor = vinculo.consumidor?.Nome || vinculo.nome_consumidor || 'N/A';
  const docConsumidor = vinculo.consumidor?.Documento || vinculo.documento_consumidor || '-';
  const nomeUsina = vinculo.usina?.NomeProprietario || vinculo.nome_proprietario || 'N/A';
  const statusDesc = vinculo.status?.Descricao || vinculo.status_nome || 'Ativo';

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/vinculos" className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm bg-gray-50">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium text-blue-600">#{vinculo.id}</span>
              <span>•</span>
              <span>{nomeConsumidor}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><User size={64} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User size={20} /></div>
            <h3 className="font-semibold text-gray-700">Consumidor</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 line-clamp-1">{nomeConsumidor}</p>
          <p className="text-sm text-gray-500">{docConsumidor}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={64} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600"><Zap size={20} /></div>
            <h3 className="font-semibold text-gray-700">Usina Geradora</h3>
          </div>
          <p className="text-lg font-bold text-gray-900 line-clamp-1">{nomeUsina}</p>
          <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{vinculo.Percentual}% participação</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={64} /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg text-green-600"><TrendingUp size={20} /></div>
            <h3 className="font-semibold text-gray-700">Status</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">{statusDesc}</p>
          <p className="text-sm text-gray-400">Desde {new Date(vinculo.DataInicio).toLocaleDateString()}</p>
        </div>
      </div>

      {/* BOTÃO PARA A TELA DE FINANCEIRO */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-8 text-center shadow-inner">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Gestão Financeira</h2>
        <p className="text-blue-600 mb-6 max-w-2xl mx-auto">
          Acesse a área dedicada para lançamentos de faturas, recibos e histórico financeiro deste contrato.
        </p>
        <button 
          onClick={() => navigate(`/vinculos/${id}/financeiro`)}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
        >
          <DollarSign size={24} />
          Abrir Histórico Financeiro
        </button>
      </div>
    </div>
  );
}
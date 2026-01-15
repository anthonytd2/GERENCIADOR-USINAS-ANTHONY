import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, User, Zap, TrendingUp } from 'lucide-react';

interface VinculoDetalhado {
  id: number;
  Percentual: number;
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
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        // BUSCA APENAS O VÍNCULO. Sem financeiro, sem erro.
        const dados = await api.vinculos.get(Number(id));
        setVinculo(dados);
      } catch (error) {
        console.error("Erro ao carregar vinculo:", error);
        alert('Erro ao carregar detalhes do vínculo.');
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
  const statusDesc = vinculo.status?.Descricao || vinculo.status_nome || 'Ativo';

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      {/* CABEÇALHO */}
      <div className="flex items-center gap-4">
        <Link to="/vinculos" className="p-2 hover:bg-white rounded-full text-gray-600 bg-gray-50 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo</h1>
          <div className="text-sm text-gray-500">#{vinculo.id} • {nomeConsumidor}</div>
        </div>
      </div>

      {/* CARDS DE INFORMAÇÃO (Só o essencial) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consumidor */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold">
            <User size={20}/> Consumidor
          </div>
          <p className="text-lg font-bold text-gray-900">{nomeConsumidor}</p>
          <p className="text-sm text-gray-500">{vinculo.consumidor?.Documento || '-'}</p>
        </div>

        {/* Usina */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-yellow-600 font-semibold">
            <Zap size={20}/> Usina
          </div>
          <p className="text-lg font-bold text-gray-900">{nomeUsina}</p>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
            {vinculo.Percentual}% de participação
          </span>
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-green-600 font-semibold">
            <TrendingUp size={20}/> Status
          </div>
          <p className="text-lg font-bold text-gray-900">{statusDesc}</p>
          <p className="text-sm text-gray-400">Desde {new Date(vinculo.DataInicio).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* SEM FINANCEIRO, SEM TABELA, SEM ERRO */}
    </div>
  );
}
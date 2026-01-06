import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface VinculoDetalhado {
  VinculoID: number;
  Consumidores: { Nome: string; MediaConsumo: number };
  Usinas: { NomeProprietario: string; GeracaoEstimada: number };
  Status: { Descricao: string };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.vinculos.get(Number(id)) // Precisamos adicionar esse 'get' na api.ts depois? Não, vamos usar fetch direto aqui se precisar ou atualizar api.ts
        .then(setVinculo)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Pequeno ajuste: Como o api.ts talvez não tenha o 'get' de vinculo, 
  // você pode adicionar lá ou usar este fetch direto aqui para testar:
  /* Se der erro no api.vinculos.get, adicione no arquivo lib/api.ts:
     get: (id: number) => fetch(`${API_BASE}/vinculos/${id}`).then(r => r.json()),
  */

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir este vínculo?')) return;
    await api.vinculos.delete(Number(id));
    navigate('/vinculos');
  };

  if (loading) return <div className="text-center py-8">Carregando...</div>;
  if (!vinculo) return <div className="text-center py-8">Vínculo não encontrado</div>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/vinculos" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Detalhes do Vínculo #{vinculo.VinculoID}</h2>
          <div className="flex space-x-2">
            <Link to={`/vinculos/${id}/editar`} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button onClick={handleDelete} className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cartão do Consumidor */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Consumidor</h3>
            <p className="text-2xl font-bold text-blue-800">{vinculo.Consumidores.Nome}</p>
            <p className="text-sm text-blue-600 mt-1">Consumo Médio: {vinculo.Consumidores.MediaConsumo} kWh</p>
          </div>

          {/* Cartão da Usina */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-900 mb-2">Usina</h3>
            <p className="text-2xl font-bold text-green-800">{vinculo.Usinas.NomeProprietario}</p>
            <p className="text-sm text-green-600 mt-1">Geração Estimada: {vinculo.Usinas.GeracaoEstimada} kWh</p>
          </div>

          {/* Status */}
          <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
            <span className="font-medium text-gray-700">Status do Relacionamento:</span>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {vinculo.Status.Descricao}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
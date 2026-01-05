import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  MediaConsumo: number | null;
  PercentualDesconto: string | null;
  ValorKW: string | null;
  TempoContratoAnos: number | null;
  InicioContrato: string | null;
  VencimentoContrato: string | null;
  Vendedor: string | null;
}

interface Vinculo {
  VinculoID: number;
  Usinas: { NomeProprietario: string };
  Status: { Descricao: string };
}

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<Consumidor | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      api.consumidores.get(Number(id)),
      api.consumidores.vinculos(Number(id))
    ]).then(([cons, vinc]) => {
      setConsumidor(cons);
      setVinculos(vinc);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir este consumidor?')) return;

    await api.consumidores.delete(Number(id));
    navigate('/consumidores');
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!consumidor) {
    return <div className="text-center py-8">Consumidor não encontrado</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/consumidores"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{consumidor.Nome}</h2>
          <div className="flex space-x-2">
            <Link
              to={`/consumidores/${id}/editar`}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">Média Consumo (kWh)</p>
            <p className="text-base font-medium text-gray-900">{consumidor.MediaConsumo ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Percentual Desconto</p>
            <p className="text-base font-medium text-gray-900">
              {consumidor.PercentualDesconto ? `${(parseFloat(consumidor.PercentualDesconto) * 100).toFixed(2)}%` : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor kW (R$)</p>
            <p className="text-base font-medium text-gray-900">{consumidor.ValorKW ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tempo Contrato (anos)</p>
            <p className="text-base font-medium text-gray-900">{consumidor.TempoContratoAnos ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Início Contrato</p>
            <p className="text-base font-medium text-gray-900">
              {consumidor.InicioContrato ? new Date(consumidor.InicioContrato).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vencimento Contrato</p>
            <p className="text-base font-medium text-gray-900">
              {consumidor.VencimentoContrato ? new Date(consumidor.VencimentoContrato).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Vendedor</p>
            <p className="text-base font-medium text-gray-900">{consumidor.Vendedor ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Vínculos Associados</h3>
        {vinculos.length === 0 ? (
          <p className="text-gray-500">Nenhum vínculo cadastrado</p>
        ) : (
          <div className="space-y-3">
            {vinculos.map((vinculo) => (
              <div key={vinculo.VinculoID} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{vinculo.Usinas.NomeProprietario}</p>
                  <p className="text-sm text-gray-500">{vinculo.Status.Descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

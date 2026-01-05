import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface Usina {
  UsinaID: number;
  NomeProprietario: string;
  Potencia: number | null;
  Tipo: string | null;
  ValorKWBruto: string | null;
  GeracaoEstimada: number | null;
  InicioContrato: string | null;
  VencimentoContrato: string | null;
  TipoPagamento: string | null;
}

interface Vinculo {
  VinculoID: number;
  Consumidores: { Nome: string };
  Status: { Descricao: string };
}

export default function DetalheUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usina, setUsina] = useState<Usina | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      api.usinas.get(Number(id)),
      api.usinas.vinculos(Number(id))
    ]).then(([us, vinc]) => {
      setUsina(us);
      setVinculos(vinc);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Tem certeza que deseja excluir esta usina?')) return;

    await api.usinas.delete(Number(id));
    navigate('/usinas');
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!usina) {
    return <div className="text-center py-8">Usina não encontrada</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/usinas"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{usina.NomeProprietario}</h2>
          <div className="flex space-x-2">
            <Link
              to={`/usinas/${id}/editar`}
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
            <p className="text-sm text-gray-500">Potência (kWp)</p>
            <p className="text-base font-medium text-gray-900">{usina.Potencia ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo</p>
            <p className="text-base font-medium text-gray-900">{usina.Tipo ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor kW Bruto (R$)</p>
            <p className="text-base font-medium text-gray-900">{usina.ValorKWBruto ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Geração Estimada (kWh)</p>
            <p className="text-base font-medium text-gray-900">{usina.GeracaoEstimada ?? '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Início Contrato</p>
            <p className="text-base font-medium text-gray-900">
              {usina.InicioContrato ? new Date(usina.InicioContrato).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Vencimento Contrato</p>
            <p className="text-base font-medium text-gray-900">
              {usina.VencimentoContrato ? new Date(usina.VencimentoContrato).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Tipo Pagamento</p>
            <p className="text-base font-medium text-gray-900">{usina.TipoPagamento ?? '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Consumidores Associados</h3>
        {vinculos.length === 0 ? (
          <p className="text-gray-500">Nenhum consumidor associado</p>
        ) : (
          <div className="space-y-3">
            {vinculos.map((vinculo) => (
              <div key={vinculo.VinculoID} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{vinculo.Consumidores.Nome}</p>
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

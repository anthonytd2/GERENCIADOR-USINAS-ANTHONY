import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, Zap, Calendar, User } from 'lucide-react';

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.consumidores.get(Number(id))
        .then(setConsumidor)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Excluir este consumidor?')) return;
    await api.consumidores.delete(Number(id));
    navigate('/consumidores');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>;
  if (!consumidor) return <div className="p-8 text-center">Não encontrado</div>;

  return (
    <div>
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{consumidor.Nome}</h1>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 font-semibold rounded-full text-sm">
                Cliente Ativo
              </span>
              <span className="text-gray-500">ID: #{consumidor.ConsumidorID}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link to={`/consumidores/${id}/editar`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm">
              <Edit className="w-4 h-4 inline mr-2" /> Editar
            </Link>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
              <Trash2 className="w-4 h-4 inline mr-2" /> Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Principal */}
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" /> Dados de Energia
          </h3>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Média de Consumo</p>
              <p className="text-3xl font-bold text-gray-900">{consumidor.MediaConsumo} <span className="text-sm text-gray-400 font-normal">kWh</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Desconto Aplicado</p>
              <p className="text-3xl font-bold text-green-600">{consumidor.PercentualDesconto}%</p>
            </div>
          </div>
        </div>

        {/* Card Detalhes */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" /> Contrato
          </h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Vendedor</p>
              <p className="font-medium text-gray-900">{consumidor.Vendedor || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Vigência (Anos)</p>
              <p className="font-medium text-gray-900">{consumidor.TempoContratoAnos || '-'}</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" /> Início: {consumidor.InicioContrato || '-'}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" /> Fim: {consumidor.VencimentoContrato || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, MapPin, FileText, Zap } from 'lucide-react';

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.consumidores.get(Number(id))
        .then(setConsumidor)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Excluir este consumidor?')) return;
    try {
      await api.consumidores.delete(Number(id));
      navigate('/consumidores');
    } catch (error) {
      alert('Erro ao excluir consumidor');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  if (!consumidor) return <div className="p-8 text-center">Consumidor não encontrado</div>;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{consumidor.nome}</h1>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <FileText className="w-4 h-4" />
              <span>{consumidor.documento || 'Sem documento'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/consumidores/${id}/editar`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cartão de Contato / Endereço */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> Endereço e Contato
          </h3>
          <div className="space-y-3 text-gray-600">
            <p><span className="font-medium text-gray-900">Endereço:</span> {consumidor.endereco || '-'}</p>
            <p><span className="font-medium text-gray-900">Bairro:</span> {consumidor.bairro || '-'}</p>
            <p><span className="font-medium text-gray-900">Cidade:</span> {consumidor.cidade || '-'} / {consumidor.uf || '-'}</p>
            <p><span className="font-medium text-gray-900">CEP:</span> {consumidor.cep || '-'}</p>
          </div>
        </div>

        {/* Cartão Comercial */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Dados de Energia
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Média de Consumo</p>
              <p className="text-xl font-bold text-gray-900">{consumidor.media_consumo} kWh</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Valor do kW</p>
              <p className="text-xl font-bold text-gray-900">R$ {consumidor.valor_kw}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Desconto</p>
              <p className="text-xl font-bold text-green-600">{consumidor.percentual_desconto}%</p>
            </div>
          </div>
          {consumidor.observacao && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-900">Observações:</p>
              <p className="text-sm text-gray-600 mt-1">{consumidor.observacao}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
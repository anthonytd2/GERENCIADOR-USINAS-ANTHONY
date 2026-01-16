import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, Zap, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';

export default function DetalheUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usina, setUsina] = useState<any>(null);
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Carrega os dados da Usina e seus Vínculos
      Promise.all([
        api.usinas.get(Number(id)),
        api.usinas.vinculos(Number(id))
      ]).then(([usinaData, vinculosData]) => {
        setUsina(usinaData);
        setVinculos(vinculosData);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Excluir esta usina?')) return;
    await api.usinas.delete(Number(id));
    navigate('/usinas');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando usina...</div>;
  if (!usina) return <div className="p-8 text-center">Não encontrada</div>;

  const isLocada = vinculos.length > 0;

  return (
    <div>
      <div className="mb-8">
        <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            {/* CORREÇÃO: usina.nomeproprietario (minúsculo) */}
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{usina.nomeproprietario}</h1>
            <div className="flex items-center gap-3">
              {isLocada ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-sm border border-green-200 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> LOCADA
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-full text-sm border border-red-200 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> DISPONÍVEL
                </span>
              )}
              {/* CORREÇÃO: usina.usinaid (minúsculo) */}
              <span className="text-gray-500">ID: #{usina.usinaid}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link to={`/usinas/${id}/editar`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm flex items-center gap-2">
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Principal */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" /> Dados Técnicos
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">Potência Instalada</p>
                {/* CORREÇÃO: usina.potencia (minúsculo) */}
                <p className="text-3xl font-bold text-gray-900">{usina.potencia} <span className="text-sm text-gray-400 font-normal">kWp</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Geração Estimada</p>
                {/* CORREÇÃO: usina.geracaoestimada (minúsculo) */}
                <p className="text-3xl font-bold text-gray-900">{usina.geracaoestimada} <span className="text-sm text-gray-400 font-normal">kWh</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo da Usina</p>
                {/* CORREÇÃO: usina.tipo (minúsculo) */}
                <p className="font-medium text-lg text-gray-900">{usina.tipo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Custo kW (Bruto)</p>
                {/* CORREÇÃO: usina.valorkwbruto (minúsculo) */}
                <p className="font-medium text-lg text-gray-900">R$ {usina.valorkwbruto}</p>
              </div>
            </div>

            {/* CORREÇÃO: usina.observacao (minúsculo) */}
            {usina.observacao && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm font-bold text-gray-700 mb-2">Observações:</p>
                <p className="text-gray-600 whitespace-pre-line">{usina.observacao}</p>
              </div>
            )}
          </div>

          {/* Lista de Consumidores Vinculados */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-600" /> Consumidores Vinculados
            </h3>

            {vinculos.length === 0 ? (
              <p className="text-gray-500">Nenhum consumidor vinculado a esta usina.</p>
            ) : (
              <div className="space-y-3">
                {vinculos.map((v) => (
                  <div key={v.vinculoid} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      {/* CORREÇÃO: v.consumidores?.nome e v.status?.descricao (minúsculo) */}
                      <Link to={`/vinculos/${v.vinculoid}`} className="font-bold text-blue-600 hover:underline">
                        {v.consumidores?.nome}
                      </Link>
                      <p className="text-sm text-gray-500">Status: {v.status?.descricao}</p>
                    </div>
                    {/* CORREÇÃO: v.vinculoid (minúsculo) */}
                    <Link to={`/vinculos/${v.vinculoid}`} className="px-3 py-1 bg-white border border-gray-300 text-sm font-medium rounded hover:bg-gray-50">
                      Ver Contrato
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Detalhes Contrato */}
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Contrato Proprietário</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tipo de Pagamento</p>
              {/* CORREÇÃO: usina.tipopagamento (minúsculo) */}
              <p className="font-medium text-gray-900">{usina.tipopagamento || '-'}</p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Início</p>
              {/* CORREÇÃO: usina.iniciocontrato (minúsculo) */}
              <p className="font-medium text-gray-900">{usina.iniciocontrato || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Vencimento</p>
              {/* CORREÇÃO: usina.vencimentocontrato (minúsculo) */}
              <p className="font-medium text-gray-900">{usina.vencimentocontrato || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Ban, Zap, DollarSign, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  data_fim?: string;
  status: { descricao: string };
  consumidores: { 
    consumidor_id: number;
    nome: string; 
    documento: string; 
    cidade: string;
    uf: string;
  };
  usinas: { 
    usina_id: number;
    nome_proprietario: string; 
    potencia: number;
    tipo: string;
  };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.vinculos.get(Number(id))
        .then((data: any) => {
          setVinculo(data);
        })
        .catch(error => {
          console.error("Erro ao carregar vínculo:", error);
          alert("Não foi possível carregar os detalhes do vínculo.");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleEncerrar = async () => {
    if (!confirm('ATENÇÃO: Tem certeza que deseja encerrar este contrato? Esta ação é irreversível.')) return;
    
    try {
      // Data de hoje como data de encerramento
      const dataFim = new Date().toISOString().split('T')[0];
      await api.vinculos.encerrar(Number(id), dataFim); // Passamos a data
      alert('Vínculo encerrado com sucesso!');
      navigate('/vinculos');
    } catch (error) {
      console.error(error);
      alert('Erro ao encerrar vínculo. Tente novamente.');
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando detalhes do contrato...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500 font-bold">Contrato não encontrado.</div>;

  const isAtivo = vinculo.status?.descricao === 'Ativo';

  return (
    <div className="max-w-5xl mx-auto">
      {/* HEADER E NAVEGAÇÃO */}
      <div className="mb-8">
        <Link to="/vinculos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar à Lista
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">Contrato #{vinculo.vinculo_id}</h1>
              {isAtivo ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> ATIVO
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-full border border-gray-200 flex items-center gap-1">
                  <Ban className="w-4 h-4" /> ENCERRADO
                </span>
              )}
            </div>
            <p className="text-gray-500">Gestão da relação comercial entre Usina e Consumidor</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            {/* BOTÃO FINANCEIRO (O MAIS IMPORTANTE) */}
            <Link 
              to={`/vinculos/${id}/financeiro`}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
            >
              <DollarSign className="w-5 h-5" />
              Gestão Financeira
            </Link>
            
            {isAtivo && (
              <button 
                onClick={handleEncerrar} 
                className="px-4 py-3 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 font-medium flex items-center gap-2 transition-colors"
                title="Encerrar Contrato"
              >
                <Ban className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD DA USINA */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4 relative z-10">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Dados da Usina</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Fonte Geradora</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Proprietário da Usina</p>
              <Link to={`/usinas/${vinculo.usinas?.usina_id}`} className="font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
                {vinculo.usinas?.nome_proprietario}
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-1">Potência</p>
                <p className="font-bold text-gray-900">{vinculo.usinas?.potencia} kWp</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-1">Tipo</p>
                <p className="font-bold text-gray-900">{vinculo.usinas?.tipo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD DO CONSUMIDOR */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4 relative z-10">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Dados do Consumidor</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente Beneficiário</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome do Cliente</p>
              <Link to={`/consumidores/${vinculo.consumidores?.consumidor_id}`} className="font-bold text-xl text-gray-900 hover:text-blue-600 transition-colors">
                {vinculo.consumidores?.nome}
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase mb-1">Documento</p>
                <p className="font-medium text-gray-900 truncate" title={vinculo.consumidores?.documento}>
                  {vinculo.consumidores?.documento || '-'}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-xs text-green-700 uppercase mb-1 font-bold">Percentual Alocado</p>
                <p className="font-bold text-2xl text-green-700">{vinculo.percentual}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHES DO CONTRATO */}
      <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-900">Informações do Contrato</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Data de Início</p>
            <p className="font-medium text-gray-900">
              {vinculo.data_inicio ? new Date(vinculo.data_inicio).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Data de Término</p>
            <p className="font-medium text-gray-900">
              {vinculo.data_fim ? new Date(vinculo.data_fim).toLocaleDateString('pt-BR') : 'Indeterminado'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Localização do Cliente</p>
            <p className="font-medium text-gray-900">
              {vinculo.consumidores?.cidade}/{vinculo.consumidores?.uf}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
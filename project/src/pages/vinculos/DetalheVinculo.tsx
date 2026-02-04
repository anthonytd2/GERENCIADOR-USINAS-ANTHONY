import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Ban, Zap, DollarSign, Calendar, FileText, CheckCircle, 
  ExternalLink, Activity, AlertTriangle, Pencil, FileDown, Settings 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ModalEditarVinculo from '../../components/ModalEditarVinculo';
import { gerarContratoComodatoConsumidor, gerarContratoGestaoConsumidor } from '../../utils/gerarContratoWord';
import ModalConfigurarRateio from '../../components/ModalConfigurarRateio'; // Importado

interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
  status_id?: number;
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
  unidades_vinculadas?: {
    id: number;
    percentual_rateio?: number; // Adicionei para não dar erro no map
    unidades_consumidoras: {
      codigo_uc: string;
      endereco: string;
      bairro: string;
    }
  }[];
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modais
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalRateioAberto, setModalRateioAberto] = useState(false);

  const loadData = () => {
    if (id) {
      setLoading(true);
      api.vinculos.get(Number(id))
        .then((data: any) => setVinculo(data))
        .catch(error => console.error("Erro ao carregar vínculo:", error))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEncerrar = async () => {
    if (!confirm('ATENÇÃO: Tem certeza que deseja encerrar este contrato?')) return;
    const toastId = toast.loading('Encerrando contrato...');
    try {
      const dataFim = new Date().toISOString().split('T')[0];
      await api.vinculos.encerrar(Number(id), dataFim);
      toast.success('Vínculo encerrado com sucesso!', { id: toastId });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao encerrar vínculo.', { id: toastId });
    }
  };

  const getStatusBadge = (statusDesc: string) => {
    const s = statusDesc?.toLowerCase() || '';
    if (s.includes('ativo') || s.includes('injetando')) return { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: statusDesc };
    if (s.includes('encerrado') || s.includes('cancelado')) return { style: 'bg-gray-100 text-gray-500 border-gray-200', icon: Ban, label: statusDesc };
    if (s.includes('divergência')) return { style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: statusDesc };
    if (s.includes('pendente') || s.includes('análise')) return { style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity, label: statusDesc };
    return { style: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText, label: statusDesc || 'Indefinido' };
  };

  if (loading) return <div className="p-12 text-center text-gray-500 animate-pulse">Carregando detalhes...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500 font-bold">Contrato não encontrado.</div>;

  const isEncerrado = vinculo.status?.descricao === 'Encerrado' || vinculo.status?.descricao === 'Cancelado';
  const statusConfig = getStatusBadge(vinculo.status?.descricao);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in-down">

      {/* 1. NAVEGAÇÃO E CABEÇALHO LIMPO */}
      <div>
        <Link to="/vinculos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Voltar à Lista
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Alocação #{vinculo.vinculo_id}</h1>
              <span className={`px-3 py-1 text-sm font-bold rounded-full border flex items-center gap-1 ${statusConfig.style}`}>
                <StatusIcon className="w-4 h-4" /> {statusConfig.label?.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 mt-1">Gestão de vínculo entre Usina e Consumidor</p>
          </div>

          {/* Botão de Editar (Discreto) */}
          <button
            onClick={() => setModalEdicaoAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm font-medium"
          >
            <Pencil className="w-4 h-4" /> Editar Dados
          </button>
        </div>
      </div>

      {/* 2. AÇÕES PRINCIPAIS (O QUE USA TODO DIA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={`/vinculos/${id}/financeiro`}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={100} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Financeiro</h3>
              <p className="text-blue-100 text-sm">Gerenciar faturas e repasses</p>
            </div>
          </div>
        </Link>

        <Link
          to={`/vinculos/${id}/auditoria`}
          className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={100} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Auditoria de Créditos</h3>
              <p className="text-indigo-100 text-sm">Conferência de injeção vs fatura</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. CARDS DE INFORMAÇÃO (USINA E CONSUMIDOR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD USINA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-yellow-200 transition-colors group">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Usina Geradora</h3>
              <p className="text-xs text-gray-400 font-bold uppercase">Fonte</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Proprietário</p>
              <Link to={`/usinas/${vinculo.usinas?.usina_id}`} className="font-bold text-lg text-gray-800 hover:text-blue-600 flex items-center gap-2 transition-colors">
                {vinculo.usinas?.nome_proprietario} <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Potência</p>
                <p className="font-bold text-gray-900">{vinculo.usinas?.potencia} kWp</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Tipo</p>
                <p className="font-bold text-gray-900">{vinculo.usinas?.tipo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD CONSUMIDOR */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Consumidor</h3>
              <p className="text-xs text-gray-400 font-bold uppercase">Beneficiário</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Cliente</p>
              <Link to={`/consumidores/${vinculo.consumidores?.consumidor_id}`} className="font-bold text-lg text-gray-800 hover:text-blue-600 flex items-center gap-2 transition-colors">
                {vinculo.consumidores?.nome} <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-bold">Documento</p>
                <p className="font-medium text-gray-900 text-sm truncate">{vinculo.consumidores?.documento || '-'}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs text-emerald-700 uppercase font-bold">Percentual</p>
                <p className="font-bold text-xl text-emerald-700">{vinculo.percentual}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BLOCO DE OBSERVAÇÕES (SE HOUVER) */}
      {vinculo.observacoes && (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-amber-800 text-sm uppercase">Observações</h3>
          </div>
          <p className="text-amber-900 text-sm leading-relaxed">{vinculo.observacoes}</p>
        </div>
      )}

      {/* 5. UNIDADES CONSUMIDORAS (GRID) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" /> Unidades Vinculadas (UCs)
          </h3>

          {/* BOTÃO DE CONFIGURAR RATEIO */}
          <button
            onClick={() => setModalRateioAberto(true)}
            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
          >
            <Settings className="w-3 h-3" /> Configurar Rateio
          </button>
        </div>
        
        {!vinculo.unidades_vinculadas || vinculo.unidades_vinculadas.length === 0 ? (
          <p className="text-gray-400 italic text-sm text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            Nenhuma UC específica (Vínculo Global).
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vinculo.unidades_vinculadas.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors relative">
                
                {/* Porcentagem no Cantinho */}
                <div className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.percentual_rateio || 0}%
                </div>

                <div className="mt-1">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">UC {item.unidades_consumidoras.codigo_uc}</p>
                  <p className="text-xs text-gray-500">{item.unidades_consumidoras.endereco}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. ÁREA DE DOCUMENTOS E ADMIN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-2">
          <Settings className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-800">Administrativo & Contratos</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalhes de Data */}
          <div className="space-y-4 text-sm lg:col-span-1 border-r border-gray-100 pr-4">
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold">Início</p>
              <p className="font-medium text-gray-900">{vinculo.data_inicio ? new Date(vinculo.data_inicio).toLocaleDateString('pt-BR') : '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold">Fim</p>
              <p className="font-medium text-gray-900">{vinculo.data_fim ? new Date(vinculo.data_fim).toLocaleDateString('pt-BR') : 'Indeterminado'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold">Local</p>
              <p className="font-medium text-gray-900">{vinculo.consumidores?.cidade}/{vinculo.consumidores?.uf}</p>
            </div>
          </div>

          {/* Ações de Documentação */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-4">Emissão de Documentos</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => gerarContratoComodatoConsumidor(vinculo)}
                className="flex-1 min-w-[200px] px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-purple-300 hover:text-purple-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Gerar Comodato (Word)
              </button>

              <button
                onClick={() => gerarContratoGestaoConsumidor(vinculo)}
                className="flex-1 min-w-[200px] px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-emerald-300 hover:text-emerald-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                <FileDown className="w-4 h-4" /> Gerar Contrato Gestão
              </button>
            </div>

            {/* Botão de Encerrar */}
            {!isEncerrado && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={handleEncerrar}
                  className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                >
                  <Ban className="w-4 h-4" /> Encerrar este contrato permanentemente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL EDITAR DADOS --- */}
      {vinculo && (
        <ModalEditarVinculo
          isOpen={modalEdicaoAberto}
          onClose={() => setModalEdicaoAberto(false)}
          onSuccess={loadData}
          vinculo={{
            vinculo_id: vinculo.vinculo_id,
            status_id: vinculo.status_id,
            observacoes: vinculo.observacoes
          }}
        />
      )}

      {/* --- MODAL CONFIGURAR RATEIO (ESTAVA FALTANDO AQUI) --- */}
      {vinculo && (
        <ModalConfigurarRateio
            isOpen={modalRateioAberto}
            onClose={() => setModalRateioAberto(false)}
            vinculoId={vinculo.vinculo_id}
            consumidorId={vinculo.consumidores.consumidor_id}
            onSuccess={loadData}
        />
      )}
    </div>
  );
}
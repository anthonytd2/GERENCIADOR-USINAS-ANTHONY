import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Ban, Zap, DollarSign, Calendar, FileText, CheckCircle, ExternalLink, Activity, AlertTriangle, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalEditarVinculo from '../../components/ModalEditarVinculo'; // <--- Importamos o modal novo aqui!
import { gerarContratoComodatoConsumidor } from '../../utils/gerarContratoWord';

interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
  status_id?: number; // Importante para a edição
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

  // Controle do Modal de Edição
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  // Extraí a função de carregar para poder chamar ela de novo após salvar
  const loadData = () => {
    if (id) {
      setLoading(true);
      api.vinculos.get(Number(id))
        .then((data: any) => {
          setVinculo(data);
        })
        .catch(error => {
          console.error("Erro ao carregar vínculo:", error);
        })
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
      loadData(); // Recarrega os dados

    } catch (error) {
      console.error(error);
      toast.error('Erro ao encerrar vínculo.', { id: toastId });
    }
  };

  const getStatusBadge = (statusDesc: string) => {
    const s = statusDesc?.toLowerCase() || '';

    if (s.includes('ativo') || s.includes('injetando')) {
      return { style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: statusDesc };
    }
    if (s.includes('encerrado') || s.includes('cancelado')) {
      return { style: 'bg-gray-100 text-gray-500 border-gray-200', icon: Ban, label: statusDesc };
    }
    if (s.includes('divergência') || s.includes('divergencia')) {
      return { style: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle, label: statusDesc };
    }
    if (s.includes('troca') || s.includes('análise') || s.includes('pendente')) {
      return { style: 'bg-amber-100 text-amber-700 border-amber-200', icon: Activity, label: statusDesc };
    }
    if (s.includes('aguardando')) {
      return { style: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar, label: statusDesc };
    }
    return { style: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText, label: statusDesc || 'Indefinido' };
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando detalhes...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500 font-bold">Contrato não encontrado.</div>;

  const isEncerrado = vinculo.status?.descricao === 'Encerrado' || vinculo.status?.descricao === 'Cancelado';
  const statusConfig = getStatusBadge(vinculo.status?.descricao);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* HEADER E NAVEGAÇÃO */}
      <div>
        <Link to="/vinculos" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Voltar à Lista
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-800">Alocação #{vinculo.vinculo_id}</h1>

              <span className={`px-3 py-1 text-sm font-bold rounded-full border flex items-center gap-1 ${statusConfig.style}`}>
                <StatusIcon className="w-4 h-4" /> {statusConfig.label?.toUpperCase()}
              </span>

              {/* BOTÃO GERAR CONTRATO CONSUMIDOR */}
              <button
                onClick={() => gerarContratoComodatoConsumidor(vinculo)}
                className="px-4 py-2 bg-purple-600 text-white border border-purple-700 rounded-lg hover:bg-purple-700 font-medium shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Comodato Consumidor
              </button>

              {/* BOTÃO DE EDITAR (LÁPIS) */}
              <button
                onClick={() => setModalEdicaoAberto(true)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors border border-gray-200"
                title="Editar Status e Observações"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-500">Visão geral do contrato de alocação de energia</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Link
              to={`/vinculos/${id}/financeiro`}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
            >
              <DollarSign className="w-5 h-5" />
              Abrir Financeiro
            </Link>

            {!isEncerrado && (
              <button
                onClick={handleEncerrar}
                className="px-4 py-3 bg-white text-red-500 border border-red-100 rounded-xl hover:bg-red-50 font-medium flex items-center gap-2 transition-colors"
                title="Encerrar Contrato"
              >
                <Ban className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD USINA */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-yellow-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-gray-100 pb-4">
            <div className="p-3 bg-yellow-100 rounded-xl text-yellow-700 shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Usina Geradora</h3>
              <p className="text-xs text-yellow-600 font-bold uppercase tracking-wide">Fonte de Energia</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Proprietário</p>
              <Link to={`/usinas/${vinculo.usinas?.usina_id}`} className="font-bold text-xl text-blue-600 hover:underline flex items-center gap-2">
                {vinculo.usinas?.nome_proprietario} <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Potência</p>
                <p className="font-bold text-gray-900 text-lg">{vinculo.usinas?.potencia} kWp</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Tipo</p>
                <p className="font-bold text-gray-900 text-lg">{vinculo.usinas?.tipo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CARD CONSUMIDOR */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-gray-100 pb-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700 shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Consumidor</h3>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Beneficiário</p>
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-sm text-gray-500 mb-1">Nome do Cliente</p>
              <Link to={`/consumidores/${vinculo.consumidores?.consumidor_id}`} className="font-bold text-xl text-blue-600 hover:underline flex items-center gap-2">
                {vinculo.consumidores?.nome} <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Documento</p>
                <p className="font-medium text-gray-900 text-sm truncate">{vinculo.consumidores?.documento || '-'}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 uppercase mb-1 font-bold">Alocação</p>
                <p className="font-bold text-2xl text-green-700">{vinculo.percentual}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BLOCO: OBSERVAÇÕES --- */}
      {vinculo.observacoes && (
        <div className="bg-amber-50 p-6 rounded-2xl shadow-sm border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-amber-800 text-lg">Observações do Contrato</h3>
          </div>
          <p className="text-amber-900 whitespace-pre-wrap leading-relaxed">
            {vinculo.observacoes}
          </p>
        </div>
      )}

      {/* LISTA DE UNIDADES CONSUMIDORAS (MANTIDO) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Unidades Consumidoras Vinculadas</h3>
        </div>

        {!vinculo.unidades_vinculadas || vinculo.unidades_vinculadas.length === 0 ? (
          <p className="text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">
            Nenhuma unidade específica listada (Vínculo Principal).
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vinculo.unidades_vinculadas.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="mt-1">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">UC {item.unidades_consumidoras.codigo_uc}</p>
                  <p className="text-sm text-gray-500">{item.unidades_consumidoras.endereco}</p>
                  <p className="text-xs text-gray-400 mt-1 uppercase font-bold">{item.unidades_consumidoras.bairro}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETALHES GERAIS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-800">Detalhes Administrativos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Início da Injeção</p>
            <p className="font-medium text-gray-900 text-lg">
              {vinculo.data_inicio ? new Date(vinculo.data_inicio).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Data de Desligamento</p>
            <p className="font-medium text-gray-900 text-lg">
              {vinculo.data_fim ? new Date(vinculo.data_fim).toLocaleDateString('pt-BR') : 'Indeterminado'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Localização</p>
            <p className="font-medium text-gray-900 text-lg flex items-center gap-1">
              {vinculo.consumidores?.cidade}/{vinculo.consumidores?.uf}
            </p>
          </div>
        </div>
      </div>

      {/* --- O MODAL FICA AQUI NO FINAL --- */}
      {vinculo && (
        <ModalEditarVinculo
          isOpen={modalEdicaoAberto}
          onClose={() => setModalEdicaoAberto(false)}
          onSuccess={loadData} // Quando salvar, recarrega a tela
          vinculo={{
            vinculo_id: vinculo.vinculo_id,
            status_id: vinculo.status_id, // Passamos o ID
            observacoes: vinculo.observacoes
          }}
        />
      )}
    </div>
  );
}
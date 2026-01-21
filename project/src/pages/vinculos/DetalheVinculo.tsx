import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Ban, Zap, DollarSign, Calendar, FileText, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- Adicionar

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
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleEncerrar = async () => {
    // Usamos o confirm nativo por enquanto (rápido), mas com tratamento de erro melhor
    if (!confirm('ATENÇÃO: Tem certeza que deseja encerrar este contrato?')) return;

    const toastId = toast.loading('Encerrando contrato...');
    try {
      const dataFim = new Date().toISOString().split('T')[0];
      await api.vinculos.encerrar(Number(id), dataFim);

      toast.success('Vínculo encerrado com sucesso!', { id: toastId });

      // Atualiza a tela localmente sem precisar recarregar tudo
      setVinculo(prev => prev ? {
        ...prev,
        data_fim: dataFim,
        status: { descricao: 'Encerrado' }
      } : null);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao encerrar vínculo.', { id: toastId });
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando detalhes...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500 font-bold">Contrato não encontrado.</div>;

  // --- LÓGICA DE STATUS CORRIGIDA ---
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let dataFim = null;
  if (vinculo.data_fim) {
    dataFim = new Date(vinculo.data_fim);
    dataFim.setHours(0, 0, 0, 0);
  }

  // Regras:
  // 1. Está vencido se tem data fim e ela já passou
  const isVencido = dataFim && dataFim < hoje;
  // 2. Está cancelado se o status diz explicitamente
  const isCancelado = vinculo.status?.descricao === 'Encerrado' || vinculo.status?.descricao === 'Cancelado';

  // 3. É Ativo se NÃO venceu e NÃO foi cancelado
  const isAtivo = !isVencido && !isCancelado;

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
              <h1 className="text-3xl font-bold text-gray-800">Contrato #{vinculo.vinculo_id}</h1>
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
            <p className="text-gray-500">Visão geral do contrato de alocação de energia</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* BOTÃO FINANCEIRO DESTAQUE */}
            <Link
              to={`/vinculos/${id}/financeiro`}
              className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
            >
              <DollarSign className="w-5 h-5" />
              Abrir Financeiro
            </Link>

            {isAtivo && (
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
        {/* CARD DA USINA (AMARELO) */}
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
              <p className="text-sm text-gray-500 mb-1">Proprietário (Link)</p>
              <Link
                to={`/usinas/${vinculo.usinas?.usina_id}`}
                className="font-bold text-xl text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
              >
                {vinculo.usinas?.nome_proprietario}
                <ExternalLink className="w-4 h-4 text-blue-400" />
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

        {/* CARD DO CONSUMIDOR (AZUL) */}
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
              <p className="text-sm text-gray-500 mb-1">Nome do Cliente (Link)</p>
              <Link
                to={`/consumidores/${vinculo.consumidores?.consumidor_id}`}
                className="font-bold text-xl text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 transition-colors"
              >
                {vinculo.consumidores?.nome}
                <ExternalLink className="w-4 h-4 text-blue-400" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-500 uppercase mb-1 font-bold">Documento</p>
                <p className="font-medium text-gray-900 text-sm truncate" title={vinculo.consumidores?.documento}>
                  {vinculo.consumidores?.documento || '-'}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 uppercase mb-1 font-bold">Alocação</p>
                <p className="font-bold text-2xl text-green-700">{vinculo.percentual}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DETALHES GERAIS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-gray-800">Detalhes Administrativos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Início do Contrato</p>
            <p className="font-medium text-gray-900 text-lg">
              {vinculo.data_inicio ? new Date(vinculo.data_inicio).toLocaleDateString('pt-BR') : '-'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Vencimento</p>
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
    </div>
  );
}
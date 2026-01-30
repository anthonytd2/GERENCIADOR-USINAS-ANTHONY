import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Edit, Trash2, Zap, Link as LinkIcon, 
  CheckCircle, XCircle, FileText, DollarSign, 
  Calendar, User, Sun, MapPin, Mail, Phone, Hash 
} from 'lucide-react';
import GerenciadorDocumentos from '../../components/GerenciadorDocumentos';
import { gerarContratoComodato, gerarContratoGestaoUsina } from '../../utils/gerarContratoWord';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { Usina } from '../../types';

export default function DetalheUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usina, setUsina] = useState<any>(null); // Mantive any para flexibilidade com vinculos
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de Modal
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        api.usinas.get(Number(id)),
        api.usinas.vinculos(Number(id))
      ]).then(([usinaData, vinculosData]) => {
        setUsina(usinaData);
        setVinculos(vinculosData || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Erro ao carregar usina.');
      })
      .finally(() => setLoading(false));
    }
  }, [id]);

  const solicitarExclusao = () => setModalAberto(true);

  const confirmarExclusao = async () => {
    if (!id) return;
    try {
      await api.usinas.delete(Number(id));
      toast.success('Usina excluída com sucesso!');
      navigate('/usinas');
    } catch (error) {
      toast.error('Erro ao excluir usina.');
    } finally {
      setModalAberto(false);
    }
  };

  const formatMoeda = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const [ano, mes, dia] = dateString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!usina) return <div className="p-8 text-center text-gray-500">Usina não encontrada</div>;

  const isLocada = vinculos.length > 0; // Lógica original mantida

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para lista
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sun className="text-yellow-500 fill-yellow-500" />
            {usina.nome_proprietario}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {isLocada ? (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-xs border border-orange-200 flex items-center gap-1 uppercase tracking-wide">
                  <CheckCircle className="w-3 h-3" /> LOCADA
                </span>
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200 flex items-center gap-1 uppercase tracking-wide">
                  <CheckCircle className="w-3 h-3" /> DISPONÍVEL
                </span>
            )}
            <span className="text-gray-400 text-sm flex items-center gap-1 ml-2">
              <MapPin className="w-3 h-3" />
              {usina.endereco_proprietario || 'Endereço não informado'}
            </span>
          </div>
        </div>

        {/* BARRA DE AÇÕES (Botões) */}
        <div className="flex flex-wrap gap-3">
          {/* Gerar Contratos */}
          <button
            onClick={() => gerarContratoComodato(usina)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-medium text-sm"
          >
            <FileText className="w-4 h-4" /> Comodato
          </button>

          <button
            onClick={() => gerarContratoGestaoUsina(usina)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all font-medium text-sm"
          >
            <DollarSign className="w-4 h-4" /> Gestão
          </button>

          {/* Editar/Excluir */}
          <Link
            to={`/usinas/${usina.usina_id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </Link>
          <button
            onClick={solicitarExclusao}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-50 transition-all shadow-sm text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* GRID DE INFORMAÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: DADOS TÉCNICOS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={120} />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Dados Técnicos
          </h3>
          
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-gray-500">Unidade Consumidora (UC)</p>
              <p className="text-xl font-bold text-blue-600 font-mono">
                {usina.numero_uc || 'Não informada'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Potência Instalada</p>
              <p className="text-2xl font-bold text-gray-900">{usina.potencia} <span className="text-sm font-medium text-gray-400">kWp</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Geração Estimada</p>
              <p className="text-2xl font-bold text-gray-900">{usina.geracao_estimada?.toLocaleString('pt-BR')} <span className="text-sm font-medium text-gray-400">kWh/mês</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tipo da Usina</p>
              <p className="text-lg font-medium text-gray-700">{usina.tipo || 'Não informado'}</p>
            </div>
          </div>
        </div>

        {/* CARD 2: CONTRATO E PAGAMENTO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={120} />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Contrato Proprietário
          </h3>
          
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-gray-500">Tipo de Pagamento</p>
              <p className="text-xl font-bold text-emerald-700">
                {usina.tipo_pagamento || 'Não definido'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Início</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(usina.inicio_contrato)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3"/> Vencimento</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(usina.vencimento_contrato)}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50">
               <p className="text-xs text-gray-500">Valor Base do kW</p>
               <p className="text-lg font-bold text-gray-900">{formatMoeda(usina.valor_kw_bruto || 0)}</p>
            </div>
          </div>
        </div>

        {/* --- CARD 3: DADOS DO PROPRIETÁRIO (ATUALIZADO) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <User size={120} />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Dados do Proprietário
          </h3>
          
          <div className="space-y-4 relative z-10">
             
             {/* Nome Completo */}
             <div>
               <p className="text-xs text-gray-500">Nome Completo</p>
               <p className="text-base font-bold text-gray-900">{usina.nome_proprietario}</p>
             </div>

             {/* Documentos */}
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">CPF / CNPJ</p>
                  <p className="text-sm font-medium text-gray-900">{usina.cpf_cnpj || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">RG</p>
                  <p className="text-sm font-medium text-gray-900">{usina.rg || '-'}</p>
                </div>
             </div>

             {/* Contatos */}
             <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2">
                   <Mail className="w-4 h-4 text-gray-400" />
                   <div>
                      <p className="text-[10px] text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900">{usina.email || '-'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Phone className="w-4 h-4 text-gray-400" />
                   <div>
                      <p className="text-[10px] text-gray-400">Telefone / WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900">{usina.telefone || '-'}</p>
                   </div>
                </div>
             </div>

             {/* Endereço */}
             <div className="pt-2 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-1">Endereço Completo</p>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {usina.endereco_proprietario || 'Endereço não informado.'}
                </p>
             </div>

             {/* Observações */}
            {usina.observacao && (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-1">Observações</p>
                <p className="text-sm text-gray-600 italic">
                  "{usina.observacao}"
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- CONSUMIDORES VINCULADOS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-500" /> Consumidores Vinculados
            </h3>
        </div>
        
        <div className="p-6">
          {vinculos.length === 0 ? (
             <div className="text-center py-8 text-gray-400">
               <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
               <p>Nenhum consumidor vinculado a esta usina.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vinculos.map((v) => (
                <div key={v.vinculo_id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {(v.consumidores?.nome || 'C').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{v.consumidores?.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${v.status?.descricao === 'Ativo' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          {v.status?.descricao || 'Ativo'}
                        </p>
                      </div>
                   </div>
                   <Link 
                     to={`/vinculos/${v.vinculo_id}`} 
                     className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                   >
                     Ver Contrato
                   </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- COFRE DE DOCUMENTOS (MANTIDO) --- */}
      <div className="mt-8">
        <GerenciadorDocumentos tipoEntidade="usina" entidadeId={Number(id)} />
      </div>

      {/* Modal de Confirmação */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Usina"
        message="Tem certeza absoluta? Isso apagará o histórico e os dados dessa usina permanentemente."
        isDestructive={true}
        confirmText="Excluir Definitivamente"
      />
    </div>
  );
}
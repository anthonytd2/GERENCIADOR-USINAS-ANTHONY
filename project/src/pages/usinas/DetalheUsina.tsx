import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Edit, Trash2, Zap, Link as LinkIcon, 
  CheckCircle, FileText, DollarSign, 
  Calendar, User, Sun, MapPin, Mail, Phone, Copy, MessageCircle 
} from 'lucide-react';
import GerenciadorDocumentos from "../../components/GerenciadorDocumentos";
import { gerarContratoComodato, gerarContratoGestaoUsina } from '../../utils/gerarContratoWord';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

export default function DetalheUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usina, setUsina] = useState<any>(null); 
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  const copiarTexto = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success('Copiado para a área de transferência!');
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
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!usina) return <div className="p-6 text-center text-gray-500">Usina não encontrada</div>;

  const isLocada = vinculos.length > 0;

  // CORREÇÃO CRÍTICA: Garante que pega o endereço independente do nome da coluna
  const enderecoReal = usina.endereco || usina.endereco_proprietario || 'Endereço não informado';

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">
      
      {/* 1. CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Voltar para lista
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shadow-sm">
              <Sun className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {usina.nome}
                {isLocada ? (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-xs border border-orange-200 flex items-center gap-1 uppercase tracking-wide">
                    <CheckCircle className="w-3 h-3" /> LOCADA
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200 flex items-center gap-1 uppercase tracking-wide">
                    <CheckCircle className="w-3 h-3" /> DISPONÍVEL
                  </span>
                )}
              </h1>
              <span className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {/* Usa o endereço corrigido aqui */}
                {enderecoReal.split(',')[0]}...
              </span>
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÕES */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 mr-2">
             <button
              onClick={() => gerarContratoComodato(usina)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all text-sm font-bold"
              title="Gerar Comodato"
            >
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Comodato</span>
            </button>
            <div className="w-px h-4 bg-gray-300"></div>
            <button
              onClick={() => gerarContratoGestaoUsina(usina)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-all text-sm font-bold"
              title="Gerar Contrato de Gestão"
            >
              <DollarSign className="w-4 h-4" /> <span className="hidden sm:inline">Gestão</span>
            </button>
          </div>

          <Link
            to={`/usinas/${usina.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all border border-blue-100"
          >
            <Edit className="w-4 h-4" /> Editar
          </Link>
          <button
            onClick={solicitarExclusao}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all border border-gray-200 hover:border-red-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. GRID DE INFORMAÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: CAPACIDADE TÉCNICA */}
        <div className="bg-white p-6 rounded-2xl shadow-md shadow-blue-50 border border-blue-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap size={140} />
          </div>
          
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Capacidade Técnica
          </h3>
          
          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-xs text-gray-500 font-bold mb-1">POTÊNCIA INSTALADA</p>
                  <p className="text-3xl font-bold text-gray-900">{usina.potencia} <span className="text-sm text-gray-400 font-medium">kWp</span></p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-bold mb-1">GERAÇÃO ESTIMADA</p>
                  <p className="text-3xl font-bold text-gray-900">{usina.geracao_estimada?.toLocaleString('pt-BR')} <span className="text-sm text-gray-400 font-medium">kWh</span></p>
               </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
               <div className="flex justify-between items-center">
                 <div>
                    <p className="text-xs text-gray-500 font-bold mb-1">UNIDADE CONSUMIDORA (UC)</p>
                    <p className="text-lg font-mono font-bold text-blue-600 bg-blue-50 inline-block px-2 rounded-md border border-blue-100">
                      {usina.numero_uc || 'N/A'}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold mb-1">TIPO</p>
                    <p className="text-sm font-bold text-gray-700">{usina.tipo || '-'}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* CARD 2: DADOS COMERCIAIS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> Modelo Comercial
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                 <DollarSign className="w-6 h-6" />
               </div>
               <div>
                 <p className="text-xs text-gray-500 font-bold uppercase">Modalidade</p>
                 <p className="text-xl font-bold text-emerald-700">{usina.tipo_pagamento || 'Não Definido'}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3"/> Início</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(usina.inicio_contrato)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3"/> Vencimento</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(usina.vencimento_contrato)}</p>
              </div>
            </div>

            <div>
               <p className="text-xs text-gray-500 mb-1">Valor do kW (Base)</p>
               <p className="text-2xl font-bold text-gray-900">{formatMoeda(usina.valor_kw_bruto || 0)}</p>
            </div>
          </div>
        </div>

        {/* CARD 3: PROPRIETÁRIO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:border-blue-200 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <User size={120} />
          </div>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" /> Dados do Proprietário
          </h3>
          
          <div className="space-y-5 relative z-10">
             <div>
               <p className="text-xs text-gray-500 font-bold mb-1">NOME COMPLETO</p>
               <p className="text-lg font-bold text-gray-900 leading-tight">{usina.nome}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-xs text-gray-500 mb-1">CPF / CNPJ</p>
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{usina.cpf_cnpj || '-'}</span>
                      {usina.cpf_cnpj && (
                        <button onClick={() => copiarTexto(usina.cpf_cnpj)} className="text-blue-400 hover:text-blue-600" title="Copiar">
                           <Copy className="w-3 h-3" />
                        </button>
                      )}
                   </div>
                </div>
                <div>
                   <p className="text-xs text-gray-500 mb-1">RG</p>
                   <span className="text-sm font-medium text-gray-700">{usina.rg || '-'}</span>
                </div>
             </div>

             {/* CONTATOS */}
             <div className="grid grid-cols-1 gap-3 pt-2">
               {/* Telefone */}
               <div>
                  <p className="text-xs text-gray-500 mb-1">TELEFONE / WHATSAPP</p>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-sm font-bold text-gray-900">{usina.telefone || '-'}</span>
                    {usina.telefone && (
                      <a 
                        href={`https://wa.me/55${usina.telefone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
               </div>

               {/* Email */}
               <div>
                  <p className="text-xs text-gray-500 mb-1">E-MAIL</p>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]" title={usina.email}>{usina.email || '-'}</span>
                    {usina.email && (
                      <a 
                        href={`mailto:${usina.email}`}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        title="Enviar E-mail"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
               </div>
             </div>

             {/* ENDEREÇO (Aqui usamos a variável corrigida) */}
             <div className="pt-2 border-t border-gray-50">
               <p className="text-xs text-gray-500 mb-1">ENDEREÇO COMPLETO</p>
               <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200 leading-relaxed">
                 {enderecoReal}
               </p>
             </div>

             {/* OBSERVAÇÃO */}
             {usina.observacao && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">OBSERVAÇÕES</p>
                  <p className="text-sm text-gray-500 italic bg-yellow-50/50 p-2 rounded-lg border border-yellow-100">
                    "{usina.observacao}"
                  </p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* 3. CONSUMIDORES VINCULADOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-400" /> Consumidores Vinculados
            </h3>
            {vinculos.length > 0 && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                {vinculos.length} Cliente(s)
              </span>
            )}
        </div>
        
        <div className="p-6">
          {vinculos.length === 0 ? (
             <div className="text-center py-10">
               <div className="bg-gray-50 p-4 rounded-full inline-block mb-3">
                 <User className="w-8 h-8 text-gray-300" />
               </div>
               <p className="text-gray-500 font-medium">Nenhum consumidor vinculado a esta usina.</p>
               <Link to="/vinculos/novo" className="text-blue-600 font-bold text-sm hover:underline mt-2 inline-block">
                 Criar novo vínculo
               </Link>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vinculos.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-200">
                        {(v.consumidores?.nome || 'C').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-lg">{v.consumidores?.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            v.status?.descricao === 'Ativo' 
                              ? 'bg-green-50 text-green-700 border-green-100' 
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            {v.status?.descricao || 'Ativo'}
                          </span>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-500 font-medium">{v.percentual}% da Usina</span>
                        </div>
                      </div>
                   </div>
                   <Link 
                     to={`/vinculos/${v.id}`}
                     className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                     title="Ver Detalhes do Vínculo"
                   >
                     <ArrowLeft className="w-5 h-5 rotate-180" />
                   </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. COFRE DE DOCUMENTOS */}
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
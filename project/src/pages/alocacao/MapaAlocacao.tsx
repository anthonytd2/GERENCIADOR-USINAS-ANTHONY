import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Zap, Users, CheckCircle, AlertCircle, Plus, ArrowRight, Search, X, MapPin, Edit2, Trash2, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

export default function MapaAlocacao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Bancos de Dados
  const [usinas, setUsinas] = useState<any[]>([]);
  const [consumidores, setConsumidores] = useState<any[]>([]);
  const [vinculos, setVinculos] = useState<any[]>([]);

  // Controles do Modal de Match
  const [usinaSelecionada, setUsinaSelecionada] = useState<any | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');

  // Estados para Edição Rápida de Observação
  const [editandoObsId, setEditandoObsId] = useState<number | null>(null);
  const [obsTexto, setObsTexto] = useState('');

  // Estados para o Modal de Exclusão Bonito
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [vinculoParaExcluir, setVinculoParaExcluir] = useState<number | null>(null);

  useEffect(() => {
    carregarMapa();
  }, []);

  const carregarMapa = async () => {
    setLoading(true);
    try {
      const [usinasData, consumidoresData, vinculosData] = await Promise.all([
        api.usinas.list(),
        api.consumidores.list(),
        api.vinculos.list()
      ]);
      setUsinas(usinasData || []);
      setConsumidores(consumidoresData || []);
      setVinculos(vinculosData || []);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar os dados do mapa.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const guardarObservacao = async (usinaId: number) => {
    try {
      await api.usinas.update(usinaId, { observacao: obsTexto });
      setUsinas(usinas.map(u => u.id === usinaId ? { ...u, observacao: obsTexto } : u));
      toast.success('Observação guardada!');
    } catch (error) {
      toast.error('Erro ao guardar observação.');
    } finally {
      setEditandoObsId(null);
    }
  };

  const abrirModalExclusao = (vinculoId: number) => {
    setVinculoParaExcluir(vinculoId);
    setModalExcluirOpen(true);
  };

  const confirmarDesvinculacao = async () => {
    if (!vinculoParaExcluir) return;
    const toastId = toast.loading('A desfazer alocação...');
    try {
      await api.vinculos.delete(vinculoParaExcluir);
      setVinculos(vinculos.filter(v => v.id !== vinculoParaExcluir));
      toast.success('Alocação desfeita com sucesso!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao desfazer alocação.', { id: toastId });
    } finally {
      setModalExcluirOpen(false);
      setVinculoParaExcluir(null);
    }
  };

  // --- LÓGICA DE MAPEAMENTO DE CONSUMIDORES ---
  const todosOsConsumidoresMapeados = consumidores.map(c => {
    const vinculosDoCliente = vinculos.filter(v => v.consumidor_id === c.consumidor_id);
    let energiaRecebida = 0;
    vinculosDoCliente.forEach(v => {
      const usina = usinas.find(u => u.id === v.usina_id);
      if (usina && usina.geracao_estimada) {
        const percentual = v.percentual ? Number(v.percentual) / 100 : 1;
        energiaRecebida += Number(usina.geracao_estimada) * percentual;
      }
    });

    const meta = Number(c.media_consumo) || 0;
    const falta = meta - energiaRecebida;

    return {
      ...c,
      energia_recebida: energiaRecebida,
      energia_faltante: falta > 0 ? falta : 0,
      ja_possui_usina: vinculosDoCliente.length > 0
    };
  });

  // Contador externo: Apenas quem NÃO tem nenhuma usina
  const clientesTotalmenteLivres = todosOsConsumidoresMapeados.filter(c => !c.ja_possui_usina);

  // Filtro de busca dentro do modal
  const clientesParaExibirNoModal = todosOsConsumidoresMapeados.filter(c =>
    c.nome?.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    c.cidade?.toLowerCase().includes(buscaCliente.toLowerCase())
  ).sort((a, b) => (a.ja_possui_usina === b.ja_possui_usina ? 0 : a.ja_possui_usina ? 1 : -1));

  const totalLivres = usinas.filter(u => !u.is_locada && !vinculos.some(v => v.usina_id === u.id)).length;
  const totalLocadas = usinas.length - totalLivres;

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold animate-pulse">Carregando Planilha de Alocações...</div>;
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in-down">

      {/* --- CABEÇALHO E RESUMO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <MapPin className="w-7 h-7" />
            </div>
            Status Usinas
          </h1>
        </div>

        <div className="flex gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-white border border-red-100 px-7 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] text-red-900 group-hover:scale-110 transition-transform duration-500">
              <Zap size={80} />
            </div>
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1 relative z-10">Usinas Livres</p>
            <p className="text-3xl font-black text-red-800 relative z-10">{totalLivres}</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 px-7 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] text-emerald-900 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle size={80} />
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Usinas Locadas</p>
            <p className="text-3xl font-black text-emerald-800 relative z-10">{totalLocadas}</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white border border-blue-100 px-7 py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] text-blue-900 group-hover:scale-110 transition-transform duration-500">
              <Users size={80} />
            </div>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 relative z-10">Clientes Disponíveis</p>
            <p className="text-3xl font-black text-blue-800 relative z-10">{clientesTotalmenteLivres.length}</p>
          </div>
        </div>
      </div>

      {/* --- TABELA PRINCIPAL --- */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-600">
                <th className="py-2.5 px-3 font-bold border border-slate-200 bg-slate-100">Usina & Observação</th>
                <th className="py-2.5 px-3 font-bold border border-slate-200 bg-slate-100">Capacidade / Tipo / Valor</th>
                <th className="py-2.5 px-3 font-bold text-center w-24 border border-slate-200 bg-slate-100">Status</th>
                <th className="py-2.5 px-3 font-bold border border-slate-200 bg-slate-50">Consumidor & Demanda</th>
                <th className="py-2.5 px-3 font-bold text-center w-32 border border-slate-200 bg-slate-50">Ações</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {usinas.map(usina => {
                const vinculosDaUsina = vinculos.filter(v => v.usina_id === usina.id);
                const isLivre = vinculosDaUsina.length === 0;

                return (
                  <tr key={usina.id} className={`hover:bg-indigo-50/40 transition-colors duration-200 ${isLivre ? '' : 'bg-slate-50/60'}`}>
                    <td className="py-2 px-3 align-middle border border-slate-200 max-w-[260px] overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">{usina.nome}</span>
                        {editandoObsId === usina.id ? (
                          <input
                            type="text" autoFocus
                            className="text-xs px-2 py-1 border border-indigo-300 bg-indigo-50/50 rounded outline-none w-36 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                            value={obsTexto} onChange={(e) => setObsTexto(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && guardarObservacao(usina.id)}
                            onBlur={() => guardarObservacao(usina.id)}
                          />
                        ) : (
                          <div className="group/obs relative flex items-center cursor-pointer" onClick={() => { setEditandoObsId(usina.id); setObsTexto(usina.observacao || ''); }}>
                            {usina.observacao ? (
                              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded truncate max-w-[130px]">Obs: {usina.observacao}</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic px-1.5 py-0.5 hover:bg-slate-100 rounded opacity-0 group-hover/obs:opacity-100">+ Obs</span>
                            )}
                            <Edit2 size={10} className="ml-1 opacity-0 group-hover/obs:opacity-100 text-indigo-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 align-middle border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">{usina.geracao_estimada?.toLocaleString()} kWh</span>
                        <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">{usina.tipo || 'GD'}</span>
                        <span className="font-bold text-emerald-600">{fmt(usina.valor_kw_bruto)}/kW</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center align-middle border border-slate-200 bg-white">
                      {isLivre ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold uppercase ring-1 ring-red-500/20">Livre</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase ring-1 ring-emerald-500/20">Locada</span>
                      )}
                    </td>
                    <td className="py-2 px-3 align-middle border border-slate-200 bg-slate-50/40">
                      {!isLivre ? vinculosDaUsina.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-[12px] flex items-center gap-1"><Users size={12} className="text-emerald-500" /> {v.consumidores?.nome}</span>
                          <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200/60">Alocado: {usina.geracao_estimada?.toLocaleString()} kWh</span>
                        </div>
                      )) : <span className="text-slate-400 italic text-xs">Aguardando...</span>}
                    </td>
                    <td className="py-2 px-3 text-center align-middle border border-slate-200 bg-slate-50/40">
                      <div className="flex items-center justify-center gap-1.5">
                        {isLivre ? (
                          <button onClick={() => setUsinaSelecionada(usina)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px] font-bold hover:bg-indigo-700 transition-all"><Plus size={12} className="inline mr-1" /> Vincular</button>
                        ) : (
                          <>
                            <button onClick={() => navigate(`/vinculos/${vinculosDaUsina[0]?.id}`)} className="bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded text-[11px] font-bold hover:bg-slate-50 transition-all">Contrato <ArrowRight size={12} className="inline ml-1" /></button>
                            <button onClick={() => abrirModalExclusao(vinculosDaUsina[0]?.id)} className="p-1 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded transition-all"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ModalConfirmacao isOpen={modalExcluirOpen} onClose={() => { setModalExcluirOpen(false); setVinculoParaExcluir(null); }} onConfirm={confirmarDesvinculacao} title="Desfazer Alocação" message="Deseja realmente remover este vínculo? O cliente voltará para a fila." isDestructive={true} confirmText="Desvincular" />

      {/* --- MODAL DE VINCULAÇÃO (ATUALIZADO COM TODOS OS CLIENTES) --- */}
      {usinaSelecionada && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white flex justify-between items-start">
              <div>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1.5">Vincular Usina</p>
                <h2 className="text-2xl font-black">{usinaSelecionada.nome}</h2>
                <p className="text-indigo-100 text-xs mt-1">Selecione abaixo qualquer consumidor para receber esta energia.</p>
              </div>
              <button onClick={() => setUsinaSelecionada(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Pesquisar por nome ou cidade..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
              </div>
            </div>

            <div className="overflow-y-auto p-5 bg-slate-50/30 flex-1 space-y-6">
              {/* SEÇÃO 1: Clientes Aguardando Primeira Usina */}
              <div>
                <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Aguardando Primeira Usina ({clientesParaExibirNoModal.filter(c => !c.ja_possui_usina).length})
                </h3>
                <div className="space-y-2">
                  {clientesParaExibirNoModal.filter(c => !c.ja_possui_usina).map(cliente => (
                    <div key={cliente.consumidor_id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-800">{cliente.nome}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="font-medium text-orange-600">Demanda: {cliente.media_consumo?.toLocaleString()} kWh</span>
                          <span>{cliente.cidade || 'Cidade N/A'}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/vinculos/novo?usina=${usinaSelecionada.id}&consumidor=${cliente.consumidor_id}`)} className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">Conectar <ArrowRight size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO 2: Clientes que já possuem usinas */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ListFilter size={14} /> Já Possuem Vínculo ({clientesParaExibirNoModal.filter(c => c.ja_possui_usina).length})
                </h3>
                <div className="space-y-2 opacity-80">
                  {clientesParaExibirNoModal.filter(c => c.ja_possui_usina).map(cliente => (
                    <div key={cliente.consumidor_id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-700">{cliente.nome}</h4>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase mt-0.5">Recebendo: {cliente.energia_recebida?.toLocaleString()} kWh</p>
                      </div>
                      <button onClick={() => navigate(`/vinculos/novo?usina=${usinaSelecionada.id}&consumidor=${cliente.consumidor_id}`)} className="bg-white border border-slate-200 text-slate-600 font-bold px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">Adicionar Usina <ArrowRight size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Zap, Users, CheckCircle, AlertCircle, Plus, ArrowRight,
  Search, X, MapPin, Edit2, Trash2, ListFilter, Activity, BarChart3, Save, Tag
} from 'lucide-react';
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

  // 🟢 ESTADOS: Edição Rápida dos Dados da Usina
  const [editandoDadosId, setEditandoDadosId] = useState<number | null>(null);
  const [dadosForm, setDadosForm] = useState<any>({});

  // 🟢 ESTADOS: Edição Rápida do Status da Locação (Vínculo)
  const [editandoVinculoId, setEditandoVinculoId] = useState<number | null>(null);
  const [statusVinculoTexto, setStatusVinculoTexto] = useState('');

  // Estados para os Modais de Exclusão
  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [vinculoParaExcluir, setVinculoParaExcluir] = useState<number | null>(null);

  const [modalExcluirUsinaOpen, setModalExcluirUsinaOpen] = useState(false);
  const [usinaParaExcluir, setUsinaParaExcluir] = useState<number | null>(null);

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

  // --- FUNÇÕES DE EDIÇÃO DA USINA ---
  const iniciarEdicaoDados = (usina: any) => {
    setEditandoDadosId(usina.id);
    setDadosForm({
      nome: usina.nome || '',
      potencia: usina.potencia || 0, // 🟢 NOVO: Puxa a potência atual
      geracao_estimada: usina.geracao_estimada || 0,
      tipo: usina.tipo || '',
      valor_kw_bruto: usina.valor_kw_bruto || 0,
      tipo_pagamento: usina.tipo_pagamento || '',
      observacao: usina.observacao || ''
    });
  };

  const salvarDadosUsina = async (usinaId: number) => {
    const toastId = toast.loading('Atualizando usina...');
    try {
      // 1. Pega TODOS os dados originais da usina que já estavam no banco
      const usinaOriginal = usinas.find(u => u.id === usinaId) || {};

      // 2. Criamos um mini-limpador de números que troca vírgula por ponto de forma segura
      const tratarNumero = (valor: any) => {
        if (valor === null || valor === undefined || String(valor).trim() === '') return 0;
        if (typeof valor === 'number') return valor;
        const limpo = Number(String(valor).replace(',', '.'));
        return isNaN(limpo) ? 0 : limpo;
      };

      // 3. Montamos o pacote misturando os dados intocados com o que você acabou de digitar
      const payload = {
        ...usinaOriginal, // Despeja todos os dados antigos aqui para a API não bloquear
        nome: dadosForm.nome,
        potencia: tratarNumero(dadosForm.potencia), // 🟢 NOVO: Salva a potência editada
        geracao_estimada: tratarNumero(dadosForm.geracao_estimada),
        tipo: dadosForm.tipo,
        valor_kw_bruto: tratarNumero(dadosForm.valor_kw_bruto),
        tipo_pagamento: dadosForm.tipo_pagamento,
        observacao: dadosForm.observacao
      };

      await api.usinas.update(usinaId, payload);
      
      setUsinas(usinas.map(u => u.id === usinaId ? { ...u, ...payload } : u));
      toast.success('Dados da usina atualizados com sucesso!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar. Verifique os dados e tente novamente.', { id: toastId });
    } finally {
      setEditandoDadosId(null);
    }
  };

const guardarStatusVinculo = async (vinculoId: number) => {
    try {
      await api.vinculos.update(vinculoId, { observacao: statusVinculoTexto });
      setVinculos(vinculos.map(v => v.id === vinculoId ? { ...v, observacao: statusVinculoTexto } : v));
      toast.success('Status da locação atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status.');
    } finally {
      setEditandoVinculoId(null);
    }
  };

  // --- FUNÇÕES DE EXCLUSÃO ---
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

  const abrirModalExclusaoUsina = (usinaId: number) => {
    setUsinaParaExcluir(usinaId);
    setModalExcluirUsinaOpen(true);
  };

  const confirmarExclusaoUsina = async () => {
    if (!usinaParaExcluir) return;
    const toastId = toast.loading('Excluindo usina...');
    try {
      await api.usinas.delete(usinaParaExcluir);
      setUsinas(usinas.filter(u => u.id !== usinaParaExcluir));
      toast.success('Usina excluída com sucesso!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao excluir usina. Verifique se existem vínculos ativos.', { id: toastId });
    } finally {
      setModalExcluirUsinaOpen(false);
      setUsinaParaExcluir(null);
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

  const clientesTotalmenteLivres = todosOsConsumidoresMapeados.filter(c => !c.ja_possui_usina);

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
          <p className="text-slate-500 font-medium mt-1">Gerencie a distribuição de energia e edite valores rapidamente.</p>
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
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-separate border-spacing-y-3 whitespace-nowrap">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-5 pb-2 font-bold">Unidade Geradora & Informações</th>
              <th className="px-5 pb-2 font-bold">Capacidade & Modalidade</th>
              <th className="px-5 pb-2 font-bold text-center w-32">Status</th>
              <th className="px-5 pb-2 font-bold">Alocação (Consumidor)</th>
              <th className="px-5 pb-2 font-bold">Status da Locação</th>
              <th className="px-5 pb-2 font-bold text-center w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {usinas.map(usina => {
              const vinculosDaUsina = vinculos.filter(v => v.usina_id === usina.id);
              const isLivre = vinculosDaUsina.length === 0;

              const bordaLateral = isLivre ? 'border-l-red-500' : 'border-l-emerald-500';

              return (
                <tr key={usina.id} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 group/linha">

                  {/* COLUNA 1: Usina & Observação */}
                  <td className={`py-4 px-5 align-middle border-y border-r border-slate-200 rounded-r-xl border-l-4 ${bordaLateral} rounded-l-xl relative`}>
                    <div className="flex items-start gap-3 max-w-[280px]">
                      <div className={`p-2 rounded-xl mt-1 ${isLivre ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        <Zap size={16} className={isLivre ? 'animate-pulse' : ''} />
                      </div>

                      <div className="flex-1 overflow-hidden ml-2">
                        {editandoDadosId === usina.id ? (
                          <div className="flex flex-col gap-2 w-full animate-fade-in">
                            <input
                              type="text"
                              value={dadosForm.nome || ''}
                              onChange={(e) => setDadosForm({ ...dadosForm, nome: e.target.value })}
                              className="text-sm font-black p-2 border border-indigo-300 bg-indigo-50 text-indigo-900 rounded outline-none w-full"
                              placeholder="Nome da Usina"
                              autoFocus
                            />
                            <textarea
                              value={dadosForm.observacao || ''}
                              onChange={(e) => setDadosForm({ ...dadosForm, observacao: e.target.value })}
                              className="text-xs font-medium p-2 border border-amber-300 bg-amber-50 text-amber-900 rounded outline-none w-full resize-none"
                              placeholder="Observação (opcional)..."
                              rows={2}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-black text-slate-800 text-sm truncate">{usina.nome}</span>
                              <button
                                onClick={() => iniciarEdicaoDados(usina)}
                                className="p-1 text-indigo-400 opacity-0 group-hover/linha:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-all cursor-pointer"
                                title="Editar Usina"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>

                            {usina.observacao ? (
                              <div className="text-[10px] font-medium text-amber-800 bg-amber-100/50 border border-amber-200 px-2.5 py-1 rounded-md truncate max-w-full flex items-center gap-1.5">
                                <span className="font-bold uppercase tracking-wider text-amber-900 opacity-70">OBS:</span> {usina.observacao}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold italic px-2 py-1">
                                Sem observação
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 🟢 COLUNA 2: Capacidade, Tipo, Valor e PAGAMENTO */}
                  <td className="py-4 px-5 align-middle border-y border-slate-200">
                    {editandoDadosId === usina.id ? (
                      <div className="flex flex-col gap-2 animate-fade-in">
                        
                        {/* Linha 1: Potência e Geração */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input 
                              type="number" step="0.01" value={dadosForm.potencia} 
                              onChange={(e) => setDadosForm({ ...dadosForm, potencia: e.target.value })}
                              className="w-24 text-[11px] font-bold p-1.5 pl-2 border border-indigo-300 bg-indigo-50 rounded text-indigo-900 outline-none" 
                              placeholder="Potência"
                              title="Potência da Usina (kWp)"
                            />
                            <span className="absolute right-2 top-1.5 text-[9px] text-indigo-400 font-bold">kWp</span>
                          </div>

                          <div className="relative">
                            <input 
                              type="number" step="0.01" value={dadosForm.geracao_estimada} 
                              onChange={(e) => setDadosForm({ ...dadosForm, geracao_estimada: e.target.value })}
                              className="w-24 text-[11px] font-bold p-1.5 pl-2 border border-indigo-300 bg-indigo-50 rounded text-indigo-900 outline-none" 
                              placeholder="Geração"
                              title="Geração Estimada (kWh)"
                            />
                            <span className="absolute right-2 top-1.5 text-[9px] text-indigo-400 font-bold">kWh</span>
                          </div>
                        </div>

                        {/* Linha 2: Tipo, Valor e Modalidade */}
                        <div className="flex items-center gap-2">
                          <select 
                            value={dadosForm.tipo} onChange={(e) => setDadosForm({ ...dadosForm, tipo: e.target.value })}
                            className="w-20 text-[11px] font-bold p-1.5 border border-indigo-300 bg-indigo-50 rounded text-indigo-900 outline-none cursor-pointer"
                          >
                            <option value="">Tipo...</option>
                            <option value="GD1">GD1</option>
                            <option value="GD2">GD2</option>
                          </select>

                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-[9px] text-indigo-400 font-bold">R$</span>
                            <input 
                              type="number" step="0.0001" value={dadosForm.valor_kw_bruto} 
                              onChange={(e) => setDadosForm({ ...dadosForm, valor_kw_bruto: e.target.value })}
                              className="w-24 text-[11px] font-bold p-1.5 pl-6 border border-indigo-300 bg-indigo-50 rounded text-indigo-900 outline-none" 
                              placeholder="Valor"
                            />
                          </div>
                          
                          <select 
                            value={dadosForm.tipo_pagamento} onChange={(e) => setDadosForm({ ...dadosForm, tipo_pagamento: e.target.value })}
                            className="w-[100px] text-[11px] font-bold p-1.5 border border-indigo-300 bg-indigo-50 rounded text-indigo-900 outline-none cursor-pointer"
                          >
                            <option value="">Modalidade...</option>
                            <option value="INJETADO">Injetado</option>
                            <option value="CONSUMO">Consumo</option>
                          </select>
                        </div>

                        {/* Linha 3: Botões */}
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => salvarDadosUsina(usina.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1.5 rounded flex items-center justify-center gap-1 transition-colors">
                            <Save size={12} /> Salvar
                          </button>
                          <button onClick={() => setEditandoDadosId(null)} className="px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {/* 🟢 VISUALIZAÇÃO: Potência + Geração */}
                        <div className="flex items-baseline gap-3">
                          <div>
                            <span className="font-black text-slate-800 text-[15px]">{usina.potencia?.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">kWp</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div>
                            <span className="font-black text-slate-800 text-[15px]">{usina.geracao_estimada?.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider ml-1">kWh</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded shadow-sm uppercase">
                            {usina.tipo || 'GD'}
                          </span>
                          
                          <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded shadow-sm">
                            {fmt(usina.valor_kw_bruto)}/kW
                          </span>

                          {usina.tipo_pagamento === 'INJETADO' ? (
                            <span className="text-[9px] font-bold bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded shadow-sm uppercase flex items-center gap-1">
                              <BarChart3 size={10} /> Injetado
                            </span>
                          ) : usina.tipo_pagamento === 'CONSUMO' ? (
                            <span className="text-[9px] font-bold bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded shadow-sm uppercase flex items-center gap-1">
                              <Activity size={10} /> Consumo
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* COLUNA 3: Status */}
                  <td className="py-4 px-5 text-center align-middle border-y border-slate-200">
                    {isLivre ? (
                      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase border border-red-200 w-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Livre
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-200 w-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Locada
                      </span>
                    )}
                  </td>

                  {/* COLUNA 4: Consumidor e Demanda */}
                  <td className="py-4 px-5 align-middle border-y border-slate-200">
                    {!isLivre ? vinculosDaUsina.map((v, i) => {
                      const dadosConsumidorVinculado = consumidores.find(c => c.consumidor_id === v.consumidor_id);

                      return (
                        <div key={i} className="flex flex-col gap-1 bg-slate-50 p-3 rounded-xl border border-slate-200 w-fit min-w-[220px]">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                            <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
                              <Users size={14} />
                            </div>
                            <span className="truncate max-w-[160px]">{v.consumidores?.nome}</span>
                          </span>

                          <span className="text-[10px] text-slate-500 ml-9 font-medium">
                            Média Consumo: <strong className="text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {dadosConsumidorVinculado?.media_consumo?.toLocaleString() || 0} kWh
                            </strong>
                          </span>
                        </div>
                      );
                    }) : (
                      <div className="flex items-center gap-2 text-slate-400 bg-slate-50 border border-dashed border-slate-300 p-3 rounded-xl w-fit min-w-[220px]">
                        <AlertCircle size={16} className="text-slate-300" />
                        <span className="text-xs font-medium italic">Aguardando alocação...</span>
                      </div>
                    )}
                  </td>

{/* 🟢 COLUNA 5: STATUS DA LOCAÇÃO (NOVA COLUNA DESTAQUE) */}
                  <td className="py-4 px-5 align-middle border-y border-slate-200">
                    {!isLivre ? vinculosDaUsina.map((v, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        {editandoVinculoId === v.id ? (
                          <div className="flex flex-col gap-1 animate-fade-in">
                            <input
                              type="text" autoFocus
                              className="text-xs px-3 py-2 border border-purple-300 bg-purple-50 rounded-lg outline-none w-44 focus:ring-2 focus:ring-purple-500/30 transition-all shadow-inner text-purple-900 font-bold"
                              value={statusVinculoTexto} onChange={(e) => setStatusVinculoTexto(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && guardarStatusVinculo(v.id)}
                              onBlur={() => guardarStatusVinculo(v.id)}
                              placeholder="Ex: Assinatura Pendente..."
                            />
                            <span className="text-[9px] text-slate-400 italic px-1">Enter para salvar</span>
                          </div>
                        ) : (
                          // 🟢 MUDANÇA AQUI: Trocado v.status por v.observacao
                          <div className="group/status relative flex items-center cursor-pointer" onClick={() => { setEditandoVinculoId(v.id); setStatusVinculoTexto(v.observacao || ''); }}>
                            {v.observacao ? (
                              <div className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg truncate max-w-[180px] flex items-center gap-1.5 shadow-sm">
                                <Tag size={12} className="text-purple-500" />
                                {v.observacao}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-bold italic px-3 py-1.5 bg-slate-50 border border-dashed border-slate-300 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 rounded-lg transition-all opacity-80 group-hover/status:opacity-100 flex items-center gap-1">
                                + Definir Status
                              </span>
                            )}
                            <Edit2 size={14} className="ml-2 opacity-0 group-hover/status:opacity-100 text-purple-500 transition-opacity" />
                          </div>
                        )}
                      </div>
                    )) : (
                      <span className="text-slate-300 text-xs italic">-</span>
                    )}
                  </td>
                  
                  {/* COLUNA 6: Ações */}
                  <td className="py-4 px-5 text-center align-middle border-y border-slate-200 border-r rounded-r-xl">
                    <div className="flex items-center justify-center gap-2">
                      {isLivre ? (
                        <>
                          <button onClick={() => setUsinaSelecionada(usina)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-1.5 shadow-indigo-200 shadow-sm">
                            <Plus size={16} /> Vincular
                          </button>
                          <button onClick={() => abrirModalExclusaoUsina(usina.id)} className="p-2 bg-white border border-slate-300 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm" title="Excluir Usina">
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/vinculos/${vinculosDaUsina[0]?.id}`)} className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-1.5 shadow-sm">
                            Contrato <ArrowRight size={14} />
                          </button>
                          <button onClick={() => abrirModalExclusao(vinculosDaUsina[0]?.id)} className="p-2 bg-white border border-slate-300 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-xl transition-all shadow-sm" title="Desfazer Vínculo">
                            <Trash2 size={16} />
                          </button>
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

      {/* --- MODAIS DE EXCLUSÃO --- */}
      <ModalConfirmacao isOpen={modalExcluirOpen} onClose={() => { setModalExcluirOpen(false); setVinculoParaExcluir(null); }} onConfirm={confirmarDesvinculacao} title="Desfazer Alocação" message="Deseja realmente remover este vínculo? O cliente voltará para a fila de disponíveis." isDestructive={true} confirmText="Desvincular" />
      <ModalConfirmacao isOpen={modalExcluirUsinaOpen} onClose={() => { setModalExcluirUsinaOpen(false); setUsinaParaExcluir(null); }} onConfirm={confirmarExclusaoUsina} title="Excluir Usina Permanente" message="Atenção! Isso removerá a usina definitivamente do sistema. Deseja continuar?" isDestructive={true} confirmText="Excluir Usina" />

      {/* --- MODAL DE VINCULAÇÃO --- */}
      {usinaSelecionada && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 transform scale-100">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white flex justify-between items-start">
              <div>
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1.5">Vincular Usina</p>
                <h2 className="text-2xl font-black">{usinaSelecionada.nome}</h2>
                <p className="text-indigo-100 text-xs mt-1">Selecione abaixo qualquer consumidor para receber esta energia.</p>
              </div>
              <button onClick={() => setUsinaSelecionada(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50/80">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Pesquisar por nome ou cidade..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium shadow-sm" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
              </div>
            </div>

            <div className="overflow-y-auto p-5 bg-slate-50/50 flex-1 space-y-6">
              {/* SEÇÃO 1: Clientes Aguardando Primeira Usina */}
              <div>
                <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Aguardando Primeira Usina ({clientesParaExibirNoModal.filter(c => !c.ja_possui_usina).length})
                </h3>
                <div className="space-y-2">
                  {clientesParaExibirNoModal.filter(c => !c.ja_possui_usina).map(cliente => (
                    <div key={cliente.consumidor_id} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-indigo-400 hover:shadow-md transition-all group cursor-default">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{cliente.nome}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span className="font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">Demanda: {cliente.media_consumo?.toLocaleString()} kWh</span>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {cliente.cidade || 'Cidade N/A'}</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/vinculos/novo?usina=${usinaSelecionada.id}&consumidor=${cliente.consumidor_id}`)} className="bg-indigo-50 text-indigo-700 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-indigo-100 group-hover:border-indigo-600">
                        Conectar <ArrowRight size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO 2: Clientes que já possuem usinas */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ListFilter size={14} /> Já Possuem Vínculo ({clientesParaExibirNoModal.filter(c => c.ja_possui_usina).length})
                </h3>
                <div className="space-y-2 opacity-90">
                  {clientesParaExibirNoModal.filter(c => c.ja_possui_usina).map(cliente => (
                    <div key={cliente.consumidor_id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-white hover:border-indigo-300 transition-all group cursor-default">
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">{cliente.nome}</h4>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1.5 bg-indigo-50 inline-block px-2 py-0.5 rounded border border-indigo-100">
                          Recebendo: {cliente.energia_recebida?.toLocaleString()} kWh
                        </p>
                      </div>
                      <button onClick={() => navigate(`/vinculos/novo?usina=${usinaSelecionada.id}&consumidor=${cliente.consumidor_id}`)} className="bg-white border border-slate-300 shadow-sm text-slate-600 font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center gap-2">
                        Somar Usina <ArrowRight size={16} />
                      </button>
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
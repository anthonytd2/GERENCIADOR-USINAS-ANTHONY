import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, AlertTriangle, CheckCircle, Zap, FileText, Calendar, Activity, Pencil, Users, Calculator
} from 'lucide-react';
import { AuditoriaVinculo, AuditoriaFatura } from '../types';

interface Props {
  vinculoId: number;
  percentualVinculo: number;
}

export default function AuditoriaVinculoComponent({ vinculoId, percentualVinculo }: Props) {
  const [auditorias, setAuditorias] = useState<AuditoriaVinculo[]>([]);
  const [unidadesDoContrato, setUnidadesDoContrato] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Estado do Formulário
  const [form, setForm] = useState({
    mes_referencia: new Date().toISOString().slice(0, 7), // YYYY-MM
    data_leitura_gerador: '',
    geracao_usina: '',
    consumo_proprio_usina: '',
    observacao: '',
    // A lista de faturas agora terá um campo interno '_tempId' para o React não se perder
    faturas: [] as any[]
  });

  const [simulacao, setSimulacao] = useState({
    liquidoUsina: 0,
    direitoClienteTotal: 0,
    totalInjetadoReal: 0,
    diferencaGeracao: 0,
    status: 'PENDENTE',
    somaPercentuais: 0
  });

  useEffect(() => {
    // Se o modal estiver aberto, recarrega as configurações para garantir que pegamos alterações recentes no Rateio
    if (modalOpen) {
      loadConfiguracaoUnidades();
    }
    // Carrega o histórico sempre que o ID mudar ou o modal fechar (para atualizar a lista)
    loadAuditorias();
  }, [vinculoId, modalOpen]); // <--- ADICIONAMOS modalOpen AQUI

  // --- FUNÇÃO SEGURA PARA DATA ---
  // Converte qualquer formato vindo do banco para YYYY-MM-DD
  const safeDate = (val: string | null | undefined) => {
    if (!val) return '';
    // Pega apenas os 10 primeiros caracteres se for ISO string
    return String(val).substring(0, 10);
  };

  const loadAuditorias = async () => {
    try {
      setLoading(true);
      const data = await api.vinculos.getAuditorias(vinculoId);
      setAuditorias(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguracaoUnidades = async () => {
    try {
      const vinculoData = await api.vinculos.get(vinculoId);

      // Aqui tratamos a gambiarra do backend: Se vier ID 0, ignoramos ou tratamos
      // O ideal é confiar na lista 'unidades_vinculadas' se ela existir e tiver IDs reais
      if (vinculoData.unidades_vinculadas && vinculoData.unidades_vinculadas.length > 0) {
        setUnidadesDoContrato(vinculoData.unidades_vinculadas);
      } else {
        // Se realmente não tiver nada (nem fallback do backend), pegamos os dados do consumidor
        // Mas evitamos criar IDs falsos aqui para não confundir a lógica
        setUnidadesDoContrato([]);
      }
    } catch (error) {
      console.error("Erro ao carregar UCs", error);
    }
  };

  // CÁLCULOS ATUALIZADOS (Respeitando a soma dos rateios das UCs)
  useEffect(() => {
    const geracao = Number(form.geracao_usina) || 0;
    const consumoProprio = Number(form.consumo_proprio_usina) || 0;

    // 1. Calcula o Excedente Real (O Bolo)
    const liquidoUsina = Math.max(0, geracao - consumoProprio);

    // 2. Soma quanto % foi distribuído nas faturas (Ex: 50%)
    const somaPercentuais = form.faturas.reduce((acc: number, f: any) => acc + (Number(f.percentual_aplicado) || 0), 0);

    // 3. O "Esperado" é calculado sobre essa soma, não sobre o contrato total
    const direitoClienteTotal = liquidoUsina * (somaPercentuais / 100);

    // 4. O Real é o que foi digitado
    const totalInjetadoReal = form.faturas.reduce((acc: number, f: any) => acc + (Number(f.creditos_injetados) || 0), 0);

    // 5. Diferença
    const diferencaGeracao = direitoClienteTotal - totalInjetadoReal;

    let status = 'OK';
    if (Math.abs(diferencaGeracao) > 5) status = 'DIVERGENCIA_GERACAO';

    setSimulacao({
      liquidoUsina,
      direitoClienteTotal,
      totalInjetadoReal,
      diferencaGeracao,
      status,
      somaPercentuais // Salva para mostrar na tela
    });

  }, [form]); // Removemos 'percentualVinculo' da dependência pois agora usamos a soma das faturas

  const abrirModalNovo = async () => {
    setEditingId(null);
    const hoje = new Date().toISOString().slice(0, 10);

    // --- BLOCO NOVO: Força busca atualizada no banco antes de abrir ---
    const toastLoad = toast.loading('Verificando contrato...');
    let listaUcs = [];

    try {
      const vinculoData = await api.vinculos.get(vinculoId);
      // Pega exatamente o que está no banco (sem criar fakes)
      listaUcs = vinculoData.unidades_vinculadas || [];
      setUnidadesDoContrato(listaUcs); // Atualiza o estado local também
    } catch (e) {
      console.error("Erro ao buscar UCs frescas", e);
      listaUcs = unidadesDoContrato; // Fallback para o cache se der erro de rede
    } finally {
      toast.dismiss(toastLoad);
    }

    // Se a lista vier vazia, avisa e NÃO ABRE o modal (força o usuário a configurar)
    if (listaUcs.length === 0) {
      toast.error('Configure o rateio na aba Detalhes antes de criar uma conferência.');
      return;
    }
    // ------------------------------------------------------------------

    const faturasIniciais = listaUcs.map((uc: any) => ({
      unidade_id: uc.unidade_consumidora_id,
      percentual_aplicado: uc.percentual_rateio,
      codigo_uc: uc.unidades_consumidoras?.codigo_uc,
      endereco: uc.unidades_consumidoras?.endereco,

      data_leitura: hoje,
      saldo_anterior: 0,
      creditos_injetados: 0,
      creditos_consumidos: 0,
      saldo_final: 0
    }));

    setForm({
      mes_referencia: new Date().toISOString().slice(0, 7),
      data_leitura_gerador: hoje,
      geracao_usina: '',
      consumo_proprio_usina: '',
      observacao: '',
      faturas: faturasIniciais
    });
    setModalOpen(true);
  };

  // --- MODO EDIÇÃO ---
  const abrirModalEdicao = (item: AuditoriaVinculo) => {
    setEditingId(item.id);

    const mesFormatado = item.mes_referencia ? item.mes_referencia.substring(0, 7) : '';
    let faturasParaOForm = [];

    // CENÁRIO A: Auditoria Nova (Já tem faturas salvas na tabela filha)
    if (item.faturas && item.faturas.length > 0) {
      faturasParaOForm = item.faturas.map((f: AuditoriaFatura) => ({
        ...f,
        _tempId: `db_${f.id}`, // ID único baseado no banco
        data_leitura: safeDate(f.data_leitura),
        codigo_uc: f.unidades_consumidoras?.codigo_uc || f.codigo_uc,
        endereco: f.unidades_consumidoras?.endereco || f.endereco
      }));
    }
    // CENÁRIO B: Auditoria Antiga (Legado 1.0 - Sem faturas filhas)
    else {
      // Precisamos "recriar" as faturas baseadas no que temos hoje no contrato
      // e tentar preencher com os dados totais que foram salvos antigamente.

      // Se a lista de UCs do contrato estiver vazia (caso extremo), criamos um item fake para recuperação
      const listaBase = unidadesDoContrato.length > 0 ? unidadesDoContrato : [{
        unidade_consumidora_id: 0,
        percentual_rateio: 100,
        unidades_consumidoras: { codigo_uc: 'LEGADO', endereco: 'Dados Históricos Recuperados' }
      }];

      const dataPadrao = safeDate(item.data_leitura_consumidor) || safeDate(item.mes_referencia + '-01');

      faturasParaOForm = listaBase.map(uc => ({
        _tempId: Math.random().toString(36),
        unidade_id: uc.unidade_consumidora_id,
        percentual_aplicado: uc.percentual_rateio,
        codigo_uc: uc.unidades_consumidoras?.codigo_uc,
        endereco: uc.unidades_consumidoras?.endereco,

        data_leitura: dataPadrao,
        // Distribui o valor total na primeira UC encontrada (melhor que perder o dado)
        saldo_anterior: Number(item.saldo_anterior) || 0,
        creditos_injetados: Number(item.creditos_injetados) || 0,
        creditos_consumidos: Number(item.creditos_consumidos) || 0,
        saldo_final: Number(item.saldo_final) || 0
      }));
    }

    setForm({
      mes_referencia: mesFormatado,
      data_leitura_gerador: safeDate(item.data_leitura_gerador),
      geracao_usina: String(item.geracao_usina),
      consumo_proprio_usina: String(item.consumo_proprio_usina),
      observacao: item.observacao || '',
      faturas: faturasParaOForm
    });
    setModalOpen(true);
  };

  const updateFaturaField = (index: number, field: string, value: string) => {
    const novasFaturas = [...form.faturas];
    novasFaturas[index] = { ...novasFaturas[index], [field]: value };
    setForm({ ...form, faturas: novasFaturas });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Salvando conferência...');

    // Validação básica
    if (form.faturas.some(f => !f.unidade_id && f.unidade_id !== 0)) {
      // Se unidade_id for undefined ou null (mas permitimos 0 para legado)
      toast.error('Erro: Algumas faturas não estão vinculadas a uma UC válida.', { id: toastId });
      return;
    }

    try {
      const payload = {
        mes_referencia: `${form.mes_referencia}-01`,
        data_leitura_gerador: form.data_leitura_gerador || null,
        geracao_usina: Number(form.geracao_usina),
        consumo_proprio_usina: Number(form.consumo_proprio_usina),
        observacao: form.observacao,
        status: simulacao.status,

        faturas: form.faturas.map((f: any) => ({
          unidade_id: f.unidade_id,
          percentual_aplicado: f.percentual_aplicado,
          saldo_anterior: Number(f.saldo_anterior),
          creditos_injetados: Number(f.creditos_injetados),
          creditos_consumidos: Number(f.creditos_consumidos),
          saldo_final: Number(f.saldo_final),
          data_leitura: f.data_leitura || null
        }))
      };

      if (editingId) {
        await api.vinculos.updateAuditoria(editingId, payload);
        toast.success('Auditoria atualizada!', { id: toastId });
      } else {
        await api.vinculos.createAuditoria(vinculoId, payload);
        toast.success('Auditoria criada!', { id: toastId });
      }

      setModalOpen(false);
      loadAuditorias();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Erro ao salvar. Verifique os dados.';
      toast.error(msg, { id: toastId });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este registro e todas as faturas associadas?')) return;
    try {
      await api.vinculos.deleteAuditoria(id);
      loadAuditorias();
      toast.success('Registro excluído.');
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-down">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-lg shadow-sm text-white">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Auditoria de Compensação
          </h3>
          <p className="text-slate-300 text-sm mt-1 opacity-90">
            Confronto direto: Geração da Usina vs Créditos nas Faturas.
          </p>
        </div>

        {/* LÓGICA DO BOTÃO: Se não tiver unidades, mostra botão amarelo de verificação */}
        {unidadesDoContrato.length === 0 ? (
          <button
            onClick={abrirModalNovo} // <--- Ao clicar, ele força uma nova busca no banco
            className="px-6 py-3 bg-amber-500/10 border border-amber-500 text-amber-400 font-bold rounded-xl flex items-center gap-2 hover:bg-amber-500/20 transition-all cursor-pointer"
            title="Clique aqui para atualizar se você acabou de configurar o rateio"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Atualizar Configuração de Rateio</span>
          </button>
        ) : (
          <button
            onClick={abrirModalNovo}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-sm shadow-blue-900/50 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" /> Nova Conferência
          </button>
        )}
      </div>

      {/* LISTA (HISTÓRICO) */}
      <div className="space-y-3">
        {auditorias.map((item) => (
          <div key={item.id} className="bg-gray-50-card p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-sm transition-all flex flex-col md:flex-row items-center gap-6 group">

            <div className="flex-shrink-0 text-center md:text-left min-w-[100px]">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Referência</p>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={20} /></div>
                <span className="text-lg font-bold text-gray-900">
                  {new Date(item.mes_referencia).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full grid grid-cols-3 gap-2 text-center border-x border-gray-200 px-4">
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold">Total Injetado</p>
                <p className="text-sm font-bold text-emerald-600">
                  {item.faturas && item.faturas.length > 0
                    ? item.faturas.reduce((acc, f) => acc + (f.creditos_injetados || 0), 0).toLocaleString('pt-BR')
                    : Number(item.creditos_injetados).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold">Total Consumido</p>
                <p className="text-sm font-bold text-red-500">
                  -{item.faturas && item.faturas.length > 0
                    ? item.faturas.reduce((acc, f) => acc + (f.creditos_consumidos || 0), 0).toLocaleString('pt-BR')
                    : Number(item.creditos_consumidos).toLocaleString('pt-BR')} kWh
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-500 font-bold">Saldo Final</p>
                <p className="text-lg font-black text-gray-900">
                  {item.faturas && item.faturas.length > 0
                    ? item.faturas.reduce((acc, f) => acc + (f.saldo_final || 0), 0).toLocaleString('pt-BR')
                    : Number(item.saldo_final).toLocaleString('pt-BR')} kWh
                </p>
              </div>
            </div>

            <div className="min-w-[140px] text-center">
              {item.status === 'OK' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <CheckCircle size={14} /> Auditado OK
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200 animate-pulse">
                  <AlertTriangle size={14} /> Divergência
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => abrirModalEdicao(item)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-50-card rounded-lg shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">{editingId ? 'Editar Conferência' : 'Nova Conferência Mensal'}</h3>
                <p className="text-slate-400 text-sm">Lance a geração da Usina e preencha a fatura de cada filial.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 bg-gray-50">

              <div className="mb-6 flex justify-center">
                <div className="bg-gray-50-card p-2 px-6 rounded-full border border-gray-200 shadow-sm flex items-center gap-3">
                  <label className="text-xs font-bold text-gray-500 uppercase">Mês de Competência:</label>
                  <input type="month" required className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
                    value={form.mes_referencia} onChange={e => setForm({ ...form, mes_referencia: e.target.value })} />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">

                {/* ESQUERDA: USINA */}
                <div className="lg:w-1/3 space-y-4">
                  <div className="bg-gray-50-card p-5 rounded-lg border border-amber-200 shadow-sm space-y-4 sticky top-0">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2 border-b border-amber-100 pb-2">
                      <Zap className="text-amber-500 w-5 h-5" /> Dados do Gerador
                    </h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Data Leitura</label>
                      <input type="date" className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        value={form.data_leitura_gerador} onChange={e => setForm({ ...form, data_leitura_gerador: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Geração</label>
                        <input type="number" className="w-full p-2 border border-gray-200 rounded-lg font-bold text-gray-900" placeholder="0"
                          value={form.geracao_usina} onChange={e => setForm({ ...form, geracao_usina: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Consumo</label>
                        <input type="number" className="w-full p-2 border border-gray-200 rounded-lg font-bold text-red-500" placeholder="0"
                          value={form.consumo_proprio_usina} onChange={e => setForm({ ...form, consumo_proprio_usina: e.target.value })} />
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex justify-between items-center pt-1">
                        {/* Mostra a soma real das porcentagens (ex: 50%) */}
                        <span className="text-xs font-bold text-amber-700 uppercase">
                          A enviar ({simulacao.somaPercentuais}%)
                        </span>
                        <span className="text-xl font-black text-amber-600">
                          {simulacao.direitoClienteTotal.toFixed(0)}
                        </span>
                      </div>
                      {/* Mostra dica se não estiver em 100% */}
                      {simulacao.somaPercentuais < 100 && (
                        <p className="text-[10px] text-amber-600 mt-1 text-right">
                          * {100 - simulacao.somaPercentuais}% fica na Geradora
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* DIREITA: LISTA DE FATURAS */}
                <div className="lg:w-2/3 space-y-4">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2">
                    <FileText className="text-blue-500 w-5 h-5" /> Faturas das Filiais ({form.faturas.length})
                  </h4>

                  {form.faturas.length === 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Nenhuma unidade configurada no contrato. Vá em <strong>Configurar Rateio</strong> na tela anterior.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {form.faturas.map((fatura, index) => {

                      // === 1. LÓGICA MATEMÁTICA (PROVA REAL) ===
                      const saldoAnt = Number(fatura.saldo_anterior) || 0;
                      const injetado = Number(fatura.creditos_injetados) || 0;
                      const consumido = Number(fatura.creditos_consumidos) || 0;
                      const finalDeclarado = Number(fatura.saldo_final) || 0;

                      // A conta: O que tinha + O que entrou - O que saiu
                      const saldoCalculado = saldoAnt + injetado - consumido;

                      // Verifica se bate (com margem de erro de 1 kWh para arredondamentos)
                      const diferencaConta = saldoCalculado - finalDeclarado;
                      const isContaErrada = Math.abs(diferencaConta) > 1;
                      // ===========================================

                      return (
                        <div key={fatura._tempId || index} className="bg-gray-50-card p-4 rounded-lg border border-blue-100 shadow-sm relative group hover:border-blue-300 transition-colors">
                          <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                            <div>
                              <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
                                <Users size={14} className="text-blue-400" /> {fatura.codigo_uc || 'UC Nova'}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate w-48">{fatura.endereco || 'Endereço não carregado'}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">
                              {fatura.percentual_aplicado}% Rateio
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* DATA */}
                            <div className="flex items-center gap-2">
                              <label className="w-20 text-[10px] font-bold text-gray-500 uppercase text-right">Data</label>
                              <input type="date" className="flex-1 p-1.5 border border-gray-200 rounded text-xs"
                                value={fatura.data_leitura} onChange={e => updateFaturaField(index, 'data_leitura', e.target.value)} />
                            </div>

                            {/* SALDO ANTERIOR */}
                            <div className="flex items-center gap-2">
                              <label className="w-20 text-[10px] font-bold text-gray-500 uppercase text-right">Saldo Ant.</label>
                              <input type="number" className="flex-1 p-1.5 border border-gray-200 rounded text-right text-sm text-gray-500" placeholder="0"
                                value={fatura.saldo_anterior} onChange={e => updateFaturaField(index, 'saldo_anterior', e.target.value)} />
                            </div>

                            {/* INJETADO */}
                            <div className="flex items-center gap-2">
                              <label className="w-20 text-[10px] font-bold text-blue-600 uppercase text-right">Injetado (+)</label>
                              <input type="number" className="flex-1 p-1.5 border border-blue-200 rounded text-right text-sm font-bold text-blue-700 bg-blue-50/30" placeholder="0"
                                value={fatura.creditos_injetados} onChange={e => updateFaturaField(index, 'creditos_injetados', e.target.value)} />
                            </div>

                            {/* CONSUMIDO */}
                            <div className="flex items-center gap-2">
                              <label className="w-20 text-[10px] font-bold text-red-500 uppercase text-right">Consumido (-)</label>
                              <input type="number" className="flex-1 p-1.5 border border-red-200 rounded text-right text-sm font-bold text-red-600 bg-red-50/30" placeholder="0"
                                value={fatura.creditos_consumidos} onChange={e => updateFaturaField(index, 'creditos_consumidos', e.target.value)} />
                            </div>

                            {/* SALDO FINAL (COM VALIDAÇÃO VISUAL) */}
                            <div className="border-t border-gray-200 my-1 pt-1">
                              <div className="flex items-center gap-2">
                                <label className="w-20 text-[10px] font-bold text-gray-900 uppercase text-right">Final (=)</label>
                                <input
                                  type="number"
                                  className={`flex-1 p-1.5 border rounded text-right text-sm font-black 
                                        ${isContaErrada
                                      ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 ring-1 ring-red-200'
                                      : 'border-gray-200 text-gray-900 focus:border-blue-500'
                                    }`}
                                  placeholder="="
                                  value={fatura.saldo_final}
                                  onChange={e => updateFaturaField(index, 'saldo_final', e.target.value)}
                                />
                              </div>

                              {/* MENSAGEM DE ERRO SE A CONTA NÃO BATER */}
                              {isContaErrada && (
                                <div className="text-[10px] text-red-600 text-right mt-1 font-bold flex justify-end items-center gap-1 animate-pulse">
                                  <Calculator size={10} /> A conta correta é: {saldoCalculado}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* RODAPÉ DO MODAL */}
                  <div className="bg-gray-100 p-4 rounded-xl flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-gray-500">Total Injetado (Faturas):</span>
                      <strong className={`ml-2 text-lg ${Math.abs(simulacao.diferencaGeracao) < 5 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {simulacao.totalInjetadoReal.toFixed(0)} kWh
                      </strong>
                    </div>
                    <div className="text-right">
                      {Math.abs(simulacao.diferencaGeracao) < 5 ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={16} /> Bateu com a Usina</span>
                      ) : (
                        <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle size={16} /> Diferença: {simulacao.diferencaGeracao.toFixed(0)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 border rounded-xl font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm">Salvar Auditoria</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
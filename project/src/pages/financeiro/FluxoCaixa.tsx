import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Trash2,
  Edit2,
  PlusCircle,
  CheckSquare,
  Layers,
  CheckCircle,
  Calendar,
  Lock,
  Unlock,
  Undo2,
  PieChart,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import ModalConfirmacao from "../../components/ModalConfirmacao";
import EspelhoConciliacao, {
  Transacao,
} from "../../components/EspelhoConciliacao";

const CATEGORIAS_ENTRADA = [
  "RECEBIMENTO CONSUMIDOR",
  "ADIANTAMENTO / DEVOLUÇÃO",
  "TRANSFERÊNCIA INTERNA",
  "OUTRAS ENTRADAS",
];

const CATEGORIAS_SAIDA = [
  "REPASSE / ALUGUEL USINA",
  "PAGAMENTO FATURA (CONCESSIONÁRIA)",
  "COMISSÃO VENDEDORES",
  "TAXAS E BANCÁRIO (JUROS/PIX)",
  "IMPOSTOS",
  "TRANSFERÊNCIA INTERNA",
  "OUTRAS SAÍDAS",
];

export default function FluxoCaixa() {
  const [mesFiltro, setMesFiltro] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [saldoAnterior, setSaldoAnterior] = useState({
    conta_0: 0,
    conta_6: 0,
  });
  const [isFechado, setIsFechado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [dadosImpressao, setDadosImpressao] = useState<Transacao[] | null>(
    null,
  );

  const formInicial = {
    conta: "CONTA_0",
    tipo: "ENTRADA",
    data_operacao: new Date().toISOString().split("T")[0],
    valor: "",
    pessoa: "",
    descricao: "",
    categoria: "RECEBIMENTO CONSUMIDOR",
    observacoes: "",
    status: "PAGO",
  };

  const [formData, setFormData] = useState(formInicial);

  useEffect(() => {
    carregarDados();
    // 🟢 Aviso para o Linter ignorar a falta do carregarDados aqui e não dar erro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesFiltro]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const data = await api.fluxoCaixa.list(mesFiltro);
      setTransacoes(data.transacoes || []);
      setSaldoAnterior(data.saldoAnterior || { conta_0: 0, conta_6: 0 });
      setIsFechado(data.isFechado);
      setSelecionados([]);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar caixa.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "tipo") {
      setFormData((prev) => ({
        ...prev,
        tipo: value,
        categoria:
          value === "ENTRADA" ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor || !formData.data_operacao) {
      return toast.error("Data, Valor e Descrição são obrigatórios!");
    }

    setIsSubmitting(true);
    const toastId = toast.loading(editingId ? "Atualizando..." : "Salvando...");

    try {
      if (editingId) {
        await api.fluxoCaixa.update(editingId, formData);
        toast.success("Atualizado!", { id: toastId });
      } else {
        await api.fluxoCaixa.create(formData);
        toast.success("Lançamento registrado!", { id: toastId });
      }

      setFormData({
        ...formInicial,
        conta: formData.conta,
        tipo: formData.tipo,
        categoria: formData.categoria,
        data_operacao: formData.data_operacao,
      });
      setEditingId(null);
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConciliar = async () => {
    if (selecionados.length < 2)
      return toast.error("Selecione pelo menos 2 itens.");
    const toastId = toast.loading("Conciliando...");
    try {
      await api.fluxoCaixa.conciliar(selecionados);
      toast.success("Conciliação perfeita!", { id: toastId });
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conciliar.", { id: toastId });
    }
  };

  const handleDesfazerConciliacao = async (codigo: string) => {
    if (
      !window.confirm(
        "Desfazer esta conciliação? O spread gerado será excluído.",
      )
    )
      return;
    const toastId = toast.loading("Desfazendo...");
    try {
      await api.fluxoCaixa.desconciliar(codigo);
      toast.success("Desfeito com sucesso!", { id: toastId });
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao desfazer.", { id: toastId });
    }
  };

  const handleAbrirImpressao = async (codigo: string) => {
    const toastId = toast.loading("Gerando relatório...");
    try {
      const dados = await api.fluxoCaixa.getConciliacao(codigo);
      setDadosImpressao(dados);
      toast.success("Relatório pronto!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao buscar dados da conciliação.", { id: toastId });
    }
  };

  const handleFecharMes = async () => {
    if (!window.confirm(`Deseja travar o mês de ${mesFiltro}?`)) return;
    const toastId = toast.loading("Travando mês...");
    try {
      await api.fluxoCaixa.fecharMes({
        mes: mesFiltro,
        saldo_conta_0: saldoFinal0,
        saldo_conta_6: saldoFinal6,
      });
      toast.success("Mês fechado e protegido!", { id: toastId });
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fechar.", { id: toastId });
    }
  };

  const handleReabrirMes = async () => {
    if (
      !window.confirm(
        `Atenção: Você está prestes a DESTRAVAR o mês de ${mesFiltro}. Continuar?`,
      )
    )
      return;
    const toastId = toast.loading("Destravando mês...");
    try {
      await api.fluxoCaixa.reabrirMes(mesFiltro);
      toast.success("Mês reaberto! Edições liberadas.", { id: toastId });
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao reabrir.", { id: toastId });
    }
  };

  const toggleSelecao = (id: number) => {
    if (isFechado) return;
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleEditar = (item: Transacao) => {
    setEditingId(item.id || null);
    setFormData({
      conta: item.conta || "CONTA_0",
      tipo: item.tipo,
      descricao: item.descricao,
      valor: String(item.valor),
      data_operacao: item.data_operacao,
      status: item.status || "PAGO",
      pessoa: item.pessoa || "",
      categoria:
        item.categoria ||
        (item.tipo === "ENTRADA" ? CATEGORIAS_ENTRADA[0] : CATEGORIAS_SAIDA[0]),
      observacoes: item.observacoes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicao = () => {
    setEditingId(null);
    setFormData(formInicial);
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await api.fluxoCaixa.delete(idParaExcluir);
      toast.success("Excluído.");
      carregarDados();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir.");
    } finally {
      setModalExclusaoAberto(false);
      setIdParaExcluir(null);
    }
  };

  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  let running0 = saldoAnterior.conta_0;
  let running6 = saldoAnterior.conta_6;

  const transacoesComSaldo = transacoes.map((t: Transacao) => {
    const val = Number(t.valor) || 0;
    if (t.conta === "CONTA_0") {
      if (t.tipo === "ENTRADA") running0 += val;
      else running0 -= val;
    } else {
      if (t.tipo === "ENTRADA") running6 += val;
      else running6 -= val;
    }
    return { ...t, saldo_momento_0: running0, saldo_momento_6: running6 };
  });

  const saldoFinal0 = running0;
  const saldoFinal6 = running6;

  const resumoCategorias = transacoes.reduce(
    (acc: Record<string, { tipo: string; total: number }>, t: Transacao) => {
      const cat = t.categoria || "OUTROS";
      if (!acc[cat]) acc[cat] = { tipo: t.tipo, total: 0 };
      acc[cat].total += Number(t.valor) || 0;
      return acc;
    },
    {},
  );

  const categoriasEntrada = Object.entries(resumoCategorias).filter(
    ([cat, c]) =>
      c.tipo === "ENTRADA" &&
      cat !== "LUCRO / SPREAD" &&
      cat !== "TRANSFERÊNCIA INTERNA",
  );

  const categoriasSaida = Object.entries(resumoCategorias).filter(
    ([cat, c]) =>
      c.tipo === "SAIDA" &&
      cat !== "LUCRO / SPREAD" &&
      cat !== "TRANSFERÊNCIA INTERNA",
  );

  // 🟢 Removido o "_" aqui! Agora usamos 'item' para buscar o valor total sem gerar erro.
  const totalEntradasMes = categoriasEntrada.reduce(
    (sum, item) => sum + item[1].total,
    0,
  );

  const totalSaidasMes = categoriasSaida.reduce(
    (sum, item) => sum + item[1].total,
    0,
  );

  const spreadMes = resumoCategorias["LUCRO / SPREAD"];

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in-down print:hidden">
        {/* CABEÇALHO E MÊS VIGENTE */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <Wallet className="text-blue-600" /> Livro Razão / Caixa
            </h1>
            <p className="text-gray-500 mt-1">
              Gestão, Conciliação e Plano de Contas.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
              <Calendar size={20} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Mês Vigente
                </span>
                <input
                  type="month"
                  className="text-sm font-bold text-gray-800 outline-none bg-transparent cursor-pointer font-mono"
                  value={mesFiltro}
                  onChange={(e) => setMesFiltro(e.target.value)}
                />
              </div>
              <div className="pl-3 ml-2 border-l border-gray-200 flex items-center">
                {isFechado ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                    <Lock size={14} /> FECHADO
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                    <Unlock size={14} /> ABERTO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Saldo C0 (Trânsito)
                </span>
                <span
                  className={`text-lg font-black ${saldoFinal0 >= 0 ? "text-gray-800" : "text-red-600"}`}
                >
                  {formatarMoeda(saldoFinal0)}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers size={12} /> Saldo C6 (Cofre)
                </span>
                <span
                  className={`text-2xl font-black ${saldoFinal6 >= 0 ? "text-blue-600" : "text-red-600"}`}
                >
                  {formatarMoeda(saldoFinal6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD: RESUMO POR CATEGORIA */}
        {transacoes.length > 0 && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
              <PieChart size={18} className="text-blue-500" /> Resumo do Mês
              (Plano de Contas)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-end mb-2 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    Receitas Brutas
                  </span>
                  <span className="text-sm font-black text-gray-800">
                    {formatarMoeda(totalEntradasMes)}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {categoriasEntrada.map(([cat, dados]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1">
                        <span>{cat}</span>
                        <span>{formatarMoeda(dados.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-gray-400 h-1.5 rounded-full"
                          style={{
                            width: `${totalEntradasMes > 0 ? (dados.total / totalEntradasMes) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2 border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-red-600 uppercase">
                    Custos / Repasses
                  </span>
                  <span className="text-sm font-black text-red-700">
                    {formatarMoeda(totalSaidasMes)}
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  {categoriasSaida.map(([cat, dados]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-[10px] font-bold text-red-400 mb-1">
                        <span>{cat}</span>
                        <span>{formatarMoeda(dados.total)}</span>
                      </div>
                      <div className="w-full bg-red-50 rounded-full h-1.5">
                        <div
                          className="bg-red-400 h-1.5 rounded-full"
                          style={{
                            width: `${totalSaidasMes > 0 ? (dados.total / totalSaidasMes) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">
                  Resultado Líquido / Conta 6
                </span>
                <h4 className="text-3xl font-black text-blue-700 mb-2">
                  {spreadMes ? formatarMoeda(spreadMes.total) : "R$ 0,00"}
                </h4>
                <p className="text-[10px] text-blue-600/70 font-medium leading-tight">
                  Este é o lucro real (Spread) extraído das operações
                  conciliadas neste mês. Entradas brutas e trânsito não afetam
                  este valor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÁREA DE LANÇAMENTO */}
        {!isFechado ? (
          <div
            className={`bg-white rounded-xl shadow-sm border transition-all ${editingId ? "border-blue-400 ring-4 ring-blue-50" : "border-gray-200"}`}
          >
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
              <h2 className="font-bold text-gray-700 flex items-center gap-2">
                {editingId ? (
                  <Edit2 size={18} className="text-blue-600" />
                ) : (
                  <PlusCircle size={18} className="text-blue-600" />
                )}
                {editingId ? "Editando Lançamento" : "Novo Lançamento"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelarEdicao}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleSalvar} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Conta
                  </label>
                  <select
                    name="conta"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-gray-700 bg-gray-50"
                    value={formData.conta}
                    onChange={handleChange}
                  >
                    <option value="CONTA_0">C0 (Trânsito)</option>
                    <option value="CONTA_6">C6 (Cofre)</option>
                  </select>
                </div>

                <div className="md:col-span-3 flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <label
                    className={`flex-1 px-2 py-2 flex items-center justify-center gap-1.5 rounded-md cursor-pointer font-bold text-xs transition-all ${formData.tipo === "ENTRADA" ? "bg-white shadow text-green-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value="ENTRADA"
                      checked={formData.tipo === "ENTRADA"}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <ArrowUpCircle size={14} /> ENTRADA
                  </label>
                  <label
                    className={`flex-1 px-2 py-2 flex items-center justify-center gap-1.5 rounded-md cursor-pointer font-bold text-xs transition-all ${formData.tipo === "SAIDA" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value="SAIDA"
                      checked={formData.tipo === "SAIDA"}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <ArrowDownCircle size={14} /> SAÍDA
                  </label>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Categoria (Plano de Contas) *
                  </label>
                  <select
                    name="categoria"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-blue-500 text-sm font-bold text-gray-700"
                    value={formData.categoria}
                    onChange={handleChange}
                  >
                    {formData.tipo === "ENTRADA"
                      ? CATEGORIAS_ENTRADA.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))
                      : CATEGORIAS_SAIDA.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                  </select>
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Data *
                  </label>
                  <input
                    required
                    type="date"
                    name="data_operacao"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={formData.data_operacao}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Valor *
                  </label>
                  <input
                    required
                    type="number"
                    step="any"
                    name="valor"
                    placeholder="0.00"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-black"
                    value={formData.valor}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Descrição do Banco *
                  </label>
                  <input
                    required
                    name="descricao"
                    placeholder="Ex: PIX Usina X..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={formData.descricao}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Pagador/Recebedor
                  </label>
                  <input
                    name="pessoa"
                    placeholder="Ex: Copel, João..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={formData.pessoa}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Observações Livres
                  </label>
                  <input
                    name="observacoes"
                    placeholder="Ex: Adiantamento..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold"
                    value={formData.observacoes}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-black shadow-sm flex items-center justify-center gap-2 h-[42px] mt-5"
                  >
                    {editingId ? <Edit2 size={16} /> : <PlusCircle size={16} />}
                    {editingId ? "Atualizar" : "Lançar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Lock className="text-green-600" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-green-800 text-lg">
                  Mês Fechado e Auditado
                </h4>
                <p className="text-green-700 text-sm">
                  Os lançamentos estão travados para proteger a integridade
                  contábil.
                </p>
              </div>
            </div>
            <button
              onClick={handleReabrirMes}
              className="bg-white text-green-700 border border-green-300 px-6 py-2.5 rounded-xl font-bold hover:bg-green-100 flex items-center gap-2 transition-all"
            >
              <Unlock size={18} /> Reabrir Mês
            </button>
          </div>
        )}

        {/* EXTRATO BANCÁRIO EVOLUTIVO */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center min-h-[60px]">
            <h3 className="font-bold text-gray-700 uppercase tracking-wide text-xs">
              Extrato Bancário Detalhado
            </h3>

            <div className="flex items-center gap-4">
              {selecionados.length > 0 && !isFechado && (
                <div className="flex items-center gap-4 animate-fade-in">
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {selecionados.length} selecionados
                  </span>
                  <button
                    onClick={handleConciliar}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                  >
                    <CheckSquare size={16} /> Conciliar
                  </button>
                </div>
              )}
              {!isFechado && transacoesComSaldo.length > 0 && (
                <button
                  onClick={handleFecharMes}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black flex items-center gap-2 shadow-sm transition-all"
                >
                  <Lock size={16} /> Fechar Mês
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">
                    Histórico / Categoria
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    Movimentação
                  </th>
                  <th className="px-4 py-3 font-medium text-right">
                    Saldo Evolutivo
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="bg-gray-50/50 border-b-2 border-gray-200">
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-right font-bold text-gray-500 uppercase tracking-widest text-xs"
                  >
                    Saldos Vindos do Passado ➭
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-black text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                        C0: {formatarMoeda(saldoAnterior.conta_0)}
                      </span>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        C6: {formatarMoeda(saldoAnterior.conta_6)}
                      </span>
                    </div>
                  </td>
                  <td></td>
                </tr>

                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Carregando...
                    </td>
                  </tr>
                ) : transacoesComSaldo.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      Nenhum lançamento no mês.
                    </td>
                  </tr>
                ) : (
                  transacoesComSaldo.map((t) => {
                    const isEntrada = t.tipo === "ENTRADA";
                    const isSelecionado = selecionados.includes(t.id as number);
                    const isC6 = t.conta === "CONTA_6";

                    return (
                      <tr
                        key={t.id}
                        className={`transition-colors group border-l-4 ${isEntrada ? "border-l-green-500" : "border-l-red-500"} ${isSelecionado ? "bg-blue-50/50" : "hover:bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          {!t.conciliado && !isFechado ? (
                            <input
                              type="checkbox"
                              checked={isSelecionado}
                              onChange={() => toggleSelecao(t.id as number)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                            />
                          ) : t.conciliado ? (
                            <span
                              title="Conciliado"
                              className="flex justify-center"
                            >
                              <CheckCircle
                                size={16}
                                className="text-purple-400"
                              />
                            </span>
                          ) : (
                            <Lock size={14} className="text-gray-300 mx-auto" />
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-gray-500 font-mono text-xs whitespace-nowrap">
                          {new Date(
                            t.data_operacao + "T12:00:00Z",
                          ).toLocaleDateString("pt-BR")}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${isC6 ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}
                            >
                              {isC6 ? "C6" : "C0"}
                            </span>
                            <span
                              className={`font-bold flex items-center gap-1.5 ${t.conciliado ? "text-gray-500" : "text-gray-800"}`}
                            >
                              {isEntrada ? (
                                <ArrowUpCircle
                                  size={14}
                                  className={
                                    t.conciliado
                                      ? "text-gray-400"
                                      : "text-green-500"
                                  }
                                />
                              ) : (
                                <ArrowDownCircle
                                  size={14}
                                  className={
                                    t.conciliado
                                      ? "text-gray-400"
                                      : "text-red-500"
                                  }
                                />
                              )}
                              {t.descricao}
                            </span>
                          </div>
                          <div className="flex gap-2 ml-9 text-[10px] font-bold text-gray-400 uppercase">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {t.categoria || "Sem Categoria"}
                            </span>
                            {t.pessoa && (
                              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                {t.pessoa}
                              </span>
                            )}
                          </div>
                        </td>

                        <td
                          className={`px-4 py-3.5 text-right font-black whitespace-nowrap ${t.conciliado ? "text-gray-500" : isEntrada ? "text-green-600" : "text-red-600"}`}
                        >
                          {isEntrada ? "+" : "-"}{" "}
                          {formatarMoeda(Number(t.valor))}
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${isC6 ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                          >
                            {formatarMoeda(
                              isC6
                                ? Number(t.saldo_momento_6)
                                : Number(t.saldo_momento_0),
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* 🟢 BOTÃO DE IMPRIMIR */}
                            {t.conciliado &&
                              t.categoria === "LUCRO / SPREAD" &&
                              t.codigo_conciliacao && (
                                <button
                                  onClick={() =>
                                    handleAbrirImpressao(t.codigo_conciliacao!)
                                  }
                                  className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                  title="Imprimir Demonstrativo PDF"
                                >
                                  <Printer size={16} />
                                </button>
                              )}

                            <button
                              onClick={() => handleEditar(t)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setIdParaExcluir(t.id as number);
                                setModalExclusaoAberto(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>

                            {t.conciliado &&
                              t.categoria !== "LUCRO / SPREAD" &&
                              t.codigo_conciliacao && (
                                <button
                                  onClick={() =>
                                    handleDesfazerConciliacao(
                                      t.codigo_conciliacao!,
                                    )
                                  }
                                  className="p-1.5 text-purple-400 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider"
                                  title="Desfazer conciliação"
                                >
                                  <Undo2 size={16} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <ModalConfirmacao
          isOpen={modalExclusaoAberto}
          onClose={() => setModalExclusaoAberto(false)}
          onConfirm={confirmarExclusao}
          title="Apagar Lançamento?"
          message="Excluir este item alterará todo o saldo da empresa."
          confirmText="Sim, Excluir"
          isDestructive={true}
        />
      </div>

      {/* 🟢 TELA DE IMPRESSÃO DO PDF */}
      {dadosImpressao && (
        <EspelhoConciliacao
          dados={dadosImpressao}
          onClose={() => setDadosImpressao(null)}
        />
      )}
    </>
  );
}

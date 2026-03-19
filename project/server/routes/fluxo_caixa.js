import express from "express";
import { supabase } from "../db.js";
import xss from "xss";

const router = express.Router();

const sanitizeInput = (data) => {
  if (typeof data !== "object" || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      sanitized[key] = xss(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// 1. LISTAGEM INTELIGENTE
router.get("/", async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: "Mês obrigatório" });

    const dataInicio = `${mes}-01`;
    const [anoStr, mesStr] = mes.split("-");
    const ultimoDia = new Date(Number(anoStr), Number(mesStr), 0).getDate();
    const dataFim = `${mes}-${ultimoDia}`;

    const { data: transacoesAnteriores } = await supabase
      .from("fluxo_caixa")
      .select("conta, tipo, valor")
      .lt("data_operacao", dataInicio);

    let saldoAnterior0 = 0;
    let saldoAnterior6 = 0;

    (transacoesAnteriores || []).forEach((t) => {
      const valor = Number(t.valor) || 0;
      if (t.conta === "CONTA_0") {
        t.tipo === "ENTRADA"
          ? (saldoAnterior0 += valor)
          : (saldoAnterior0 -= valor);
      } else if (t.conta === "CONTA_6") {
        t.tipo === "ENTRADA"
          ? (saldoAnterior6 += valor)
          : (saldoAnterior6 -= valor);
      }
    });

    const { data: transacoesMes } = await supabase
      .from("fluxo_caixa")
      .select("*")
      .gte("data_operacao", dataInicio)
      .lte("data_operacao", dataFim)
      .order("data_operacao", { ascending: true })
      .order("created_at", { ascending: true });

    const { data: fechamento } = await supabase
      .from("fechamentos_caixa")
      .select("*")
      .eq("mes", mes)
      .single();

    res.json({
      saldoAnterior: { conta_0: saldoAnterior0, conta_6: saldoAnterior6 },
      transacoes: transacoesMes || [],
      isFechado: !!fechamento,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CRIAR
router.post("/", async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const payload = {
      conta: body.conta || "CONTA_0",
      tipo: body.tipo,
      descricao: body.descricao,
      valor: Number(body.valor) || 0,
      data_operacao: body.data_operacao,
      status: body.status || "PAGO",
      pessoa: body.pessoa === "" ? null : body.pessoa,
      categoria: body.categoria === "" ? null : body.categoria, // 🟢 Categoria agora é fundamental
      observacoes: body.observacoes === "" ? null : body.observacoes,
      conciliado: false,
    };

    const { data, error } = await supabase
      .from("fluxo_caixa")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. EDITAR
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeInput(req.body);
    const payload = {
      conta: body.conta,
      tipo: body.tipo,
      descricao: body.descricao,
      valor: Number(body.valor) || 0,
      data_operacao: body.data_operacao,
      status: body.status,
      pessoa: body.pessoa === "" ? null : body.pessoa,
      categoria: body.categoria === "" ? null : body.categoria, // 🟢 Categoria
      observacoes: body.observacoes === "" ? null : body.observacoes,
    };

    const { data, error } = await supabase
      .from("fluxo_caixa")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. EXCLUIR
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("fluxo_caixa")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Excluído" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. CONCILIAR
router.post("/conciliar", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0)
      return res.status(400).json({ error: "Nenhuma selecionada." });

    const { data: transacoes } = await supabase
      .from("fluxo_caixa")
      .select("*")
      .in("id", ids);

    let entradas = 0;
    let saidas = 0;
    transacoes.forEach((t) => {
      if (t.tipo === "ENTRADA") entradas += Number(t.valor);
      if (t.tipo === "SAIDA") saidas += Number(t.valor);
    });

    const spread = entradas - saidas;
    const codigo = `CONCILIACAO-${Date.now()}`;

    await supabase
      .from("fluxo_caixa")
      .update({ conciliado: true, codigo_conciliacao: codigo })
      .in("id", ids);

    if (spread !== 0) {
      const tipoSpread = spread > 0 ? "ENTRADA" : "SAIDA";
      const valorAbsoluto = Math.abs(spread);
      const datas = transacoes.map((t) => new Date(t.data_operacao).getTime());
      const dataMaisRecente = new Date(Math.max(...datas))
        .toISOString()
        .split("T")[0];

      await supabase.from("fluxo_caixa").insert([
        {
          conta: "CONTA_6",
          tipo: tipoSpread,
          descricao: `Spread de Conciliação (${transacoes.length} itens)`,
          valor: valorAbsoluto,
          data_operacao: dataMaisRecente,
          status: "PAGO",
          categoria: "LUCRO / SPREAD", // 🟢 Categoria padrão para o lucro
          observacoes: `Gerado automaticamente. Ref: ${codigo}`,
          conciliado: true,
          codigo_conciliacao: codigo,
        },
      ]);
    }
    res.json({ message: "Conciliado!", spread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. DESFAZER CONCILIAÇÃO
router.post("/desconciliar", async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo)
      return res.status(400).json({ error: "Código não informado." });

    await supabase
      .from("fluxo_caixa")
      .delete()
      .eq("codigo_conciliacao", codigo)
      .eq("categoria", "LUCRO / SPREAD");
    await supabase
      .from("fluxo_caixa")
      .update({ conciliado: false, codigo_conciliacao: null })
      .eq("codigo_conciliacao", codigo);

    res.json({ message: "Conciliação desfeita!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. FECHAR MÊS
router.post("/fechar-mes", async (req, res) => {
  try {
    const { mes, saldo_conta_0, saldo_conta_6 } = req.body;
    const { data } = await supabase
      .from("fechamentos_caixa")
      .insert([{ mes, saldo_conta_0, saldo_conta_6 }])
      .select()
      .single();
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 8. NOVA ROTA: REABRIR MÊS
router.delete("/reabrir-mes/:mes", async (req, res) => {
  try {
    const { mes } = req.params;
    const { error } = await supabase
      .from("fechamentos_caixa")
      .delete()
      .eq("mes", mes); // Apaga o registro de fechamento desse mês

    if (error) throw error;
    res.json({ message: "Mês reaberto com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🟢 9. NOVA ROTA: BUSCAR DETALHES DA CONCILIAÇÃO (Para o PDF)
router.get("/conciliacao/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;
    const { data, error } = await supabase
      .from("fluxo_caixa")
      .select("*")
      .eq("codigo_conciliacao", codigo)
      .order("tipo", { ascending: true }) // Organiza Entradas e Saídas
      .order("data_operacao", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

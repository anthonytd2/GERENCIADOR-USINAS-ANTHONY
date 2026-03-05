import express from "express";
import { supabase } from '../db.js';
import xss from 'xss'; // 🟢 Adicionada segurança XSS

const router = express.Router();

// 🟢 Função de Segurança
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// 🟢 Função para blindar o objeto (Impede Mass Assignment)
const buildTransacaoPayload = (body) => {
  return {
    vinculo_id: Number(body.vinculo_id),
    mes_referencia: body.mes_referencia,
    data_operacao: body.data_operacao,
    valor_entrada_consumidor: Number(body.valor_entrada_consumidor) || 0,
    valor_saida_geradora: Number(body.valor_saida_geradora) || 0,
    valor_saida_usina: Number(body.valor_saida_usina) || 0,
    lucro_bionova: Number(body.lucro_bionova) || 0,
    status: body.status || 'Pendente',
    observacoes: body.observacoes || null
  };
};

// GET: Lista o Extrato (Timeline) de um Vínculo Específico
router.get("/vinculo/:vinculo_id", async (req, res) => {
  try {
    const { vinculo_id } = req.params;
    
    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .eq("vinculo_id", vinculo_id)
      .order("data_operacao", { ascending: false }); 

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Erro ao buscar extrato do vínculo:", error.message);
    res.status(500).json({ error: "Erro interno ao buscar transações." });
  }
});

// POST: Criar um Lançamento Manual na Conta (Agora Seguro)
router.post("/", async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const payload = buildTransacaoPayload(body);

    const { data, error } = await supabase
      .from("transacoes")
      .insert([payload])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro ao registrar transação:", error.message);
    res.status(500).json({ error: "Erro interno ao salvar o lançamento." });
  }
});

// PUT: Atualizar Transação (Agora Seguro contra Mass Assignment)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeInput(req.body);
    
    // Removemos o vinculo_id da atualização para evitar roubo de transação entre contratos
    const payload = {
      mes_referencia: body.mes_referencia,
      data_operacao: body.data_operacao,
      valor_entrada_consumidor: Number(body.valor_entrada_consumidor) || 0,
      valor_saida_geradora: Number(body.valor_saida_geradora) || 0,
      valor_saida_usina: Number(body.valor_saida_usina) || 0,
      lucro_bionova: Number(body.lucro_bionova) || 0,
      status: body.status || 'Pendente',
      observacoes: body.observacoes || null
    };

    const { data, error } = await supabase
      .from("transacoes")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error.message);
    res.status(500).json({ error: "Erro interno ao atualizar a transação." });
  }
});

// DELETE: Remover um lançamento incorreto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("transacoes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Transação estornada/excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir transação:", error.message);
    res.status(500).json({ error: "Erro ao tentar excluir a transação." });
  }
});

export default router;
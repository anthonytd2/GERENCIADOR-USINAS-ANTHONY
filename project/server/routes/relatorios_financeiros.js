import express from 'express';
import { supabase } from '../db.js';
import xss from 'xss';

const router = express.Router();

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

// --- FUNÇÃO PARA CONSTRUIR O PAYLOAD SEGURO ---
const buildPayload = (body) => {
  const isConsumoType = body.tipo_relatorio === 'consumo' || body.tipo_relatorio === 'consumo_com_geracao';

  return {
    vinculo_id: body.vinculo_id,
    tipo_relatorio: body.tipo_relatorio,
    mes_referencia: body.mes_referencia,
    unidade_consumidora_id: isConsumoType ? (body.unidade_consumidora_id || null) : null,
    unidade_geradora: !isConsumoType ? (body.unidade_geradora || null) : null,
    
    // 🟢 CAMPOS NOVOS ADICIONADOS AQUI
    energia_te: Number(body.energia_te) || 0,
    energia_tusd: Number(body.energia_tusd) || 0,
    quanto_pagaria: Number(body.quanto_pagaria) || 0,
    economia_real_cliente: Number(body.economia_real_cliente) || 0,

    // Campos Existentes
    energia_consumida: Number(body.energia_consumida) || 0,
    energia_compensada: Number(body.energia_compensada) || 0,
    valor_tarifa: Number(body.valor_tarifa) || 0,
    outras_taxas: Number(body.outras_taxas) || 0,
    iluminacao_publica: Number(body.iluminacao_publica) || 0,
    injecao_propria: Number(body.injecao_propria) || 0,
    desconto_bandeira_injecao: Number(body.desconto_bandeira_injecao) || 0,
    valor_pago_fatura: Number(body.valor_pago_fatura) || 0,
    economia_fatura: Number(body.economia_fatura) || 0,
    desconto_economia: Number(body.desconto_economia) || 0,
    valor_economizado_solar: Number(body.valor_economizado_solar) || 0,
    total_receber: Number(body.total_receber) || 0,
    energia_acumulada: Number(body.energia_acumulada) || 0,
    leitura_anterior: Number(body.leitura_anterior) || 0,
    leitura_atual: Number(body.leitura_atual) || 0,
    qtd_injetada: Number(body.qtd_injetada) || 0,
    qtd_compensada_geradora: Number(body.qtd_compensada_geradora) || 0,
    saldo_transferido: Number(body.saldo_transferido) || 0,
    valor_kwh_bruto: Number(body.valor_kwh_bruto) || 0,
    valor_kwh_fio_b: Number(body.valor_kwh_fio_b) || 0,
    valor_kwh_liquido: Number(body.valor_kwh_liquido) || 0,
    valor_pagar: Number(body.valor_pagar) || 0,
    valor_fatura_geradora: Number(body.valor_fatura_geradora) || 0,
    valor_liquido_pagar: Number(body.valor_liquido_pagar) || 0,
    total_bruto: Number(body.total_bruto) || 0,
    dif_tusd_fio_b: Number(body.dif_tusd_fio_b) || 0,
    
    arquivo_url: body.arquivo_url || null,
    recibo_url: body.recibo_url || null
  };
};

// 1. LISTAR RELATÓRIOS DO VÍNCULO
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('relatorios_financeiros')
      .select(`*, unidades_consumidoras (codigo_uc, endereco)`)
      .eq('vinculo_id', req.params.vinculoId)
      .order('mes_referencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CRIAR RELATÓRIO
router.post('/', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const payload = buildPayload(body);

    const { data, error } = await supabase.from('relatorios_financeiros').insert([payload]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao salvar relatório:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. ATUALIZAR RELATÓRIO
router.put('/:id', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const payload = buildPayload(body);

    const { data, error } = await supabase.from('relatorios_financeiros').update(payload).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar relatório:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('relatorios_financeiros').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
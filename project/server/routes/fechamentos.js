import express from 'express';
import { supabase } from '../db.js';
import xss from 'xss';

const router = express.Router();

// Função de Segurança (Varredor de XSS)
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

// --- FUNÇÃO AUXILIAR PARA DESCOBRIR A UNIDADE CONSUMIDORA ---
async function descobrirUnidadeConsumidora(vinculoId, ucIdInformado) {
  // Se já veio o ID correto (e não for vazio), usa ele
  if (ucIdInformado && ucIdInformado !== '') return ucIdInformado;

  // Se não veio ID da UC, mas temos o Vínculo, vamos buscar no banco
  if (vinculoId) {
    const { data: vinculo } = await supabase
      .from('vinculos')
      .select('consumidor_id')
      .eq('id', vinculoId)
      .single();

    if (vinculo) {
      const { data: uc } = await supabase
        .from('unidades_consumidoras')
        .select('id') 
        .eq('consumidor_id', vinculo.consumidor_id)
        .limit(1)
        .single();

      if (uc) return uc.id;
    }
  }
  return null; // Não achou nada ou é Injetado (que não precisa de UC)
}
// -----------------------------------------------------------

// LISTAR FECHAMENTOS DO VÍNCULO
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select(`
        *,
        unidades_consumidoras (codigo_uc, endereco, bairro)
      `)
      .eq('vinculo_id', req.params.vinculoId)
      .order('mes_referencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// CRIAR (POST)
router.post('/', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    
    const ucIdParaSalvar = await descobrirUnidadeConsumidora(body.vinculo_id, body.unidade_consumidora_id);

    const payload = {
      // 🟢 NOVOS CAMPOS DO MOTOR DE CÁLCULO
      tipo_calculo: body.tipo_calculo || 'consumo',
      leitura_anterior: body.leitura_anterior || 0,
      leitura_atual: body.leitura_atual || 0,
      qtd_compensada_geradora: body.qtd_compensada_geradora || 0,

      unidade_consumidora_id: ucIdParaSalvar || null, // Pode ser nulo no Injetado
      vinculo_id: body.vinculo_id,
      mes_referencia: body.mes_referencia,
      energia_compensada: body.energia_compensada,
      consumo_rede: body.consumo_rede,
      tarifa_kwh: body.tarifa_kwh,
      total_bruto: body.total_bruto,
      tusd_fio_b: body.tusd_fio_b,
      total_fio_b: body.total_fio_b,
      valor_fatura_geradora: body.valor_fatura_geradora,
      spread: body.spread,
      tarifa_com_imposto: body.tarifa_com_imposto,
      iluminacao_publica: body.iluminacao_publica,
      outras_taxas: body.outras_taxas,
      valor_pago_fatura: body.valor_pago_fatura,
      economia_gerada: body.economia_gerada,
      valor_recebido: body.valor_recebido,
      arquivo_url: body.arquivo_url,
      recibo_url: body.recibo_url,
      saldo_acumulado_kwh: body.saldo_acumulado_kwh
    };

    const { data, error } = await supabase
      .from('fechamentos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar:', error);
    res.status(500).json({ error: error.message });
  }
});


// ATUALIZAR (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeInput(req.body);

    const ucIdParaSalvar = await descobrirUnidadeConsumidora(body.vinculo_id, body.unidade_consumidora_id);

    const payload = {
      // 🟢 NOVOS CAMPOS DO MOTOR DE CÁLCULO
      tipo_calculo: body.tipo_calculo || 'consumo',
      leitura_anterior: body.leitura_anterior || 0,
      leitura_atual: body.leitura_atual || 0,
      qtd_compensada_geradora: body.qtd_compensada_geradora || 0,

      mes_referencia: body.mes_referencia,
      energia_compensada: body.energia_compensada,
      consumo_rede: body.consumo_rede,
      tarifa_kwh: body.tarifa_kwh,
      total_bruto: body.total_bruto,
      tusd_fio_b: body.tusd_fio_b,
      total_fio_b: body.total_fio_b,
      valor_fatura_geradora: body.valor_fatura_geradora,
      spread: body.spread,
      tarifa_com_imposto: body.tarifa_com_imposto,
      iluminacao_publica: body.iluminacao_publica,
      outras_taxas: body.outras_taxas,
      valor_pago_fatura: body.valor_pago_fatura,
      economia_gerada: body.economia_gerada,
      valor_recebido: body.valor_recebido,
      saldo_acumulado_kwh: body.saldo_acumulado_kwh,
      updated_at: new Date()
    };

    // Permite setar nulo se for injetado
    payload.unidade_consumidora_id = ucIdParaSalvar || null;

    if (body.arquivo_url !== undefined) payload.arquivo_url = body.arquivo_url;
    if (body.recibo_url !== undefined) payload.recibo_url = body.recibo_url;

    const { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamento_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(500).json({ error: error.message });
  }
});


// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('fechamentos')
      .delete()
      .eq('fechamento_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR FECHAMENTOS DO VÍNCULO
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculo_id', req.params.vinculoId) // Atualizado
      .order('mes_referencia', { ascending: false }); // Atualizado

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR (POST)
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Payload limpo com snake_case
    const payload = {
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
      valor_pago_fatura: body.valor_pago_fatura, // O que o cliente pagou na conta de luz
      economia_gerada: body.economia_gerada,
      valor_recebido: body.valor_recebido, // Total a cobrar do cliente

      arquivo_url: body.arquivo_url,
      recibo_url: body.recibo_url
    };

    const { data, error } = await supabase
      .from('fechamentos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar fechamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR (PUT)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Atualiza apenas os campos permitidos
    const payload = {
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
      updated_at: new Date()
    };

    if (body.arquivo_url !== undefined) payload.arquivo_url = body.arquivo_url;
    if (body.recibo_url !== undefined) payload.recibo_url = body.recibo_url;

    const { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamento_id', id) // Atualizado
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('fechamentos')
      .delete()
      .eq('fechamento_id', req.params.id); // Atualizado

    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
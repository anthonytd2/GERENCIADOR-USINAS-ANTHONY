import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculoid', req.params.vinculoId)
      .order('mesreferencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR (POST) - Corrigido para salvar o Spread
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    console.log('Dados recebidos no POST:', body); // Para ajudar a debugar

    // Mapeia os dados garantindo que o Spread seja pego independente da letra maiúscula/minúscula
    const payload = {
      vinculoid: body.VinculoID || body.vinculoid,
      mesreferencia: body.MesReferencia || body.mesreferencia,
      energiacompensada: body.EnergiaCompensada || body.energiacompensada,
      
      // Novos campos detalhados
      consumo_rede: body.ConsumoRede || body.consumo_rede,
      tarifa_kwh: body.TarifaKwh || body.tarifa_kwh,
      total_bruto: body.TotalBruto || body.total_bruto,
      tusd_fio_b: body.TusdFioB || body.tusd_fio_b,
      total_fio_b: body.TotalFioB || body.total_fio_b,
      valor_fatura_geradora: body.ValorFaturaGeradora || body.valor_fatura_geradora,
      
      // O CAMPO DO SPREAD (LUCRO)
      spread: body.Spread !== undefined ? body.Spread : body.spread,

      // Campos Consumidor
      tarifa_com_imposto: body.TarifaComImposto || body.tarifa_com_imposto,
      iluminacao_publica: body.IluminacaoPublica || body.iluminacao_publica,
      outras_taxas: body.OutrasTaxas || body.outras_taxas,
      valor_pago_fatura: body.ValorPagoFatura || body.valor_pago_fatura,
      economia_gerada: body.EconomiaGerada || body.economia_gerada,
      valorrecebido: body.ValorRecebido || body.valorrecebido,

      arquivourl: body.ArquivoURL || body.arquivourl,
      recibourl: body.ReciboURL || body.recibourl
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

    const payload = {
      mesreferencia: body.MesReferencia || body.mesreferencia,
      energiacompensada: body.EnergiaCompensada || body.energiacompensada,
      
      consumo_rede: body.ConsumoRede || body.consumo_rede,
      tarifa_kwh: body.TarifaKwh || body.tarifa_kwh,
      total_bruto: body.TotalBruto || body.total_bruto,
      tusd_fio_b: body.TusdFioB || body.tusd_fio_b,
      total_fio_b: body.TotalFioB || body.total_fio_b,
      valor_fatura_geradora: body.ValorFaturaGeradora || body.valor_fatura_geradora,
      
      // GARANTE O SPREAD NA EDIÇÃO
      spread: body.Spread !== undefined ? body.Spread : body.spread,

      tarifa_com_imposto: body.TarifaComImposto || body.tarifa_com_imposto,
      iluminacao_publica: body.IluminacaoPublica || body.iluminacao_publica,
      outras_taxas: body.OutrasTaxas || body.outras_taxas,
      valor_pago_fatura: body.ValorPagoFatura || body.valor_pago_fatura,
      economia_gerada: body.EconomiaGerada || body.economia_gerada,
      valorrecebido: body.ValorRecebido || body.valorrecebido,

      updated_at: new Date()
    };

    // Só atualiza URLs se enviadas
    if (body.ArquivoURL !== undefined) payload.arquivourl = body.ArquivoURL;
    if (body.ReciboURL !== undefined) payload.recibourl = body.ReciboURL;

    let { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamentoid', id)
      .select()
      .single();

    // Fallback caso updated_at não exista
    if (error && error.message.includes('updated_at')) {
       delete payload.updated_at; 
       const retry = await supabase.from('fechamentos').update(payload).eq('fechamentoid', id).select().single();
       data = retry.data;
       error = retry.error;
    }

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fechamentos').delete().eq('fechamentoid', req.params.id);
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
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

// CRIAR
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    // Mapeamento completo dos campos
    const payload = {
      vinculoid: body.VinculoID,
      mesreferencia: body.MesReferencia,
      energiacompensada: body.EnergiaCompensada,
      
      // Novos campos
      consumo_rede: body.ConsumoRede,
      tarifa_kwh: body.TarifaKwh,
      total_bruto: body.TotalBruto,
      tusd_fio_b: body.TusdFioB,
      total_fio_b: body.TotalFioB,
      valor_fatura_geradora: body.ValorFaturaGeradora,
      // O 'spread' aqui será o Total Líquido a Pagar (Lucro da Usina/Empresa)
      spread: body.Spread, 

      // Campos Consumidor
      tarifa_com_imposto: body.TarifaComImposto,
      iluminacao_publica: body.IluminacaoPublica,
      outras_taxas: body.OutrasTaxas,
      valor_pago_fatura: body.ValorPagoFatura,
      economia_gerada: body.EconomiaGerada,
      valorrecebido: body.ValorRecebido, // Total a Receber do cliente

      arquivourl: body.ArquivoURL,
      recibourl: body.ReciboURL
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

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const payload = {
      mesreferencia: body.MesReferencia,
      energiacompensada: body.EnergiaCompensada,
      
      // Novos campos
      consumo_rede: body.ConsumoRede,
      tarifa_kwh: body.TarifaKwh,
      total_bruto: body.TotalBruto,
      tusd_fio_b: body.TusdFioB,
      total_fio_b: body.TotalFioB,
      valor_fatura_geradora: body.ValorFaturaGeradora,
      spread: body.Spread, 

      tarifa_com_imposto: body.TarifaComImposto,
      iluminacao_publica: body.IluminacaoPublica,
      outras_taxas: body.OutrasTaxas,
      valor_pago_fatura: body.ValorPagoFatura,
      economia_gerada: body.EconomiaGerada,
      valorrecebido: body.ValorRecebido,

      updated_at: new Date()
    };

    if (body.ArquivoURL !== undefined) payload.arquivourl = body.ArquivoURL;
    if (body.ReciboURL !== undefined) payload.recibourl = body.ReciboURL;

    let { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamentoid', id)
      .select()
      .single();

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
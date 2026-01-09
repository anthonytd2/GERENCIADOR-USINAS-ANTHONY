import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  const { data, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('vinculoid', req.params.vinculoId)
    .order('mesreferencia', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    // Agora recebe ReciboURL também
    const { VinculoID, MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL } = req.body;

    const { data, error } = await supabase
      .from('fechamentos')
      .insert([{
        vinculoid: VinculoID,
        mesreferencia: MesReferencia,
        energiacompensada: EnergiaCompensada,
        valorrecebido: ValorRecebido,
        valorpago: ValorPago,
        spread: Spread,
        arquivourl: ArquivoURL,
        recibourl: ReciboURL
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR (EDITAR)
router.put('/:id', async (req, res) => {
  try {
    const { MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL } = req.body;
    
    const { data, error } = await supabase
      .from('fechamentos')
      .update({
        mesreferencia: MesReferencia,
        energiacompensada: EnergiaCompensada,
        valorrecebido: ValorRecebido,
        valorpago: ValorPago,
        spread: Spread,
        arquivourl: ArquivoURL,
        recibourl: ReciboURL
      })
      .eq('fechamentoid', req.params.id)
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
  const { error } = await supabase.from('fechamentos').delete().eq('fechamentoid', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
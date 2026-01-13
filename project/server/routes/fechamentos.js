import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// Listar
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculoid', req.params.vinculoId)
      .order('mesreferencia', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Criar
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fechamentos').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ATUALIZAR (Edição de Mês Errado) ---
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL } = req.body;

    // Monta objeto dinâmico (só atualiza o que mudar)
    const payload = {
      mesreferencia: MesReferencia,
      energiacompensada: EnergiaCompensada,
      valorrecebido: ValorRecebido,
      valorpago: ValorPago,
      spread: Spread,
      updated_at: new Date()
    };
    if (ArquivoURL) payload.arquivourl = ArquivoURL;
    if (ReciboURL) payload.recibourl = ReciboURL;

    const { data, error } = await supabase.from('fechamentos').update(payload).eq('fechamentoid', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Excluir
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('fechamentos').delete().eq('fechamentoid', req.params.id);
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
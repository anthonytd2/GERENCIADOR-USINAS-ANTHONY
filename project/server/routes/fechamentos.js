import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  // CORREÇÃO: Tabela 'fechamentos' e coluna 'vinculoid' em minúsculo
  const { data, error } = await supabase
    .from('fechamentos')
    .select('*')
    .eq('vinculoid', req.params.vinculoId)
    .order('mesreferencia', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  
  // Garante que retorna um array vazio se não houver dados, evitando erro no map
  res.json(data || []);
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { VinculoID, MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL } = req.body;

    // CORREÇÃO: Tabela e colunas em minúsculo
    const { data, error } = await supabase
      .from('fechamentos')
      .insert([{
        vinculoid: VinculoID,
        mesreferencia: MesReferencia,
        energiacompensada: EnergiaCompensada,
        valorrecebido: ValorRecebido,
        valorpago: ValorPago,
        spread: Spread,
        arquivourl: ArquivoURL
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  // CORREÇÃO: 'fechamentos' e 'fechamentoid'
  const { error } = await supabase.from('fechamentos').delete().eq('fechamentoid', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
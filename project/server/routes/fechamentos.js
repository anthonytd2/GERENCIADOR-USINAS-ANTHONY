import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR HISTÓRICO
router.get('/:vinculoId', async (req, res) => {
  try {
    // Busca na tabela 'fechamentos' (minúsculo)
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculoid', req.params.vinculoId)
      .order('mesreferencia', { ascending: false });

    if (error) {
      console.error('Erro Supabase (GET):', error); // Mostra o erro real no terminal
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data || []);
  } catch (err) {
    console.error('Erro Servidor:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// SALVAR NOVO FECHAMENTO (COM RECIBO)
router.post('/', async (req, res) => {
  try {
    const { VinculoID, MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL } = req.body;

    console.log('Tentando salvar:', req.body);

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

    if (error) {
      console.error('Erro Supabase (POST):', error);
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('fechamentos')
    .delete()
    .eq('fechamentoid', req.params.id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
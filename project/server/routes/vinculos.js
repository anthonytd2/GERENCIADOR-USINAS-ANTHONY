import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        VinculoID,
        ConsumidorID,
        UsinaID,
        StatusID,
        consumidores(Nome),
        usinas(NomeProprietario),
        status(Descricao)
      `)
      .order('VinculoID');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UM (DETALHES) - CORRIGIDO
router.get('/:id', async (req, res) => {
  try {
    // ADICIONEI 'observacao' NA LISTA ABAIXO
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        VinculoID,
        ConsumidorID,
        UsinaID,
        StatusID,
        observacao, 
        consumidores(Nome, MediaConsumo), 
        usinas(NomeProprietario, GeracaoEstimada), 
        status(Descricao)
      `)
      .eq('VinculoID', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vínculo não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTAS DE CRIAR/EDITAR/EXCLUIR (Mantenha igual ou use o padrão abaixo)
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vinculos').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vinculos').update(req.body).eq('VinculoID', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('vinculos').delete().eq('VinculoID', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
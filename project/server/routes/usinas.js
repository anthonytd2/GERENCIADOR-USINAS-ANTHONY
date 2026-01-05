import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Usinas')
      .select('UsinaID, NomeProprietario')
      .order('NomeProprietario');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Usinas')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Usinas')
      .select('*')
      .eq('UsinaID', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Usina not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Usinas')
      .update(req.body)
      .eq('UsinaID', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Usina not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('Usinas')
      .delete()
      .eq('UsinaID', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/vinculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('Vinculos')
      .select(`
        VinculoID,
        ConsumidorID,
        UsinaID,
        StatusID,
        Consumidores(Nome),
        Status(Descricao)
      `)
      .eq('UsinaID', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

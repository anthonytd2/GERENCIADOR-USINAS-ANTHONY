import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Tabelas e colunas em minúsculo (padrão do banco)
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        consumidores (nome),
        usinas (nomeproprietario),
        status (descricao)
      `)
      .order('vinculoid'); // Ordena pelo ID correto

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UM (DETALHES)
router.get('/:id', async (req, res) => {
  try {
    // CORREÇÃO: Busca por ID minúsculo e relacionamentos minúsculos
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        consumidores (nome, mediaconsumo),
        usinas (nomeproprietario, geracaoestimada),
        status (descricao)
      `)
      .eq('vinculoid', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vínculo não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    // O Supabase geralmente aceita o body se as chaves baterem, 
    // mas idealmente o frontend já deve mandar minúsculo ou o banco aceita.
    const { data, error } = await supabase.from('vinculos').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .update(req.body)
      .eq('vinculoid', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('vinculoid', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
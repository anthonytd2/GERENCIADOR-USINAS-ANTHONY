import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js'; // Importa a regra de validação

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  try {
    // Busca usinas e já traz o nome da concessionária junto (join)
    const { data, error } = await supabase
      .from('usinas')
      .select('*, concessionarias(nome)')
      .order('NomeProprietario');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UMA (Detalhe)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('id', req.params.id) // Atenção: Usinas geralmente usam 'id' minúsculo
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR (COM VALIDAÇÃO)
router.post('/', async (req, res) => {
  try {
    // 1. Validação com Zod
    const dadosLimpos = usinaSchema.parse(req.body);

    // 2. Salvar no banco
    const { data, error } = await supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (error) {
    if (error.issues) {
      const mensagens = error.issues.map(i => `${i.path[0]}: ${i.message}`).join(' | ');
      return res.status(400).json({ error: mensagens });
    }
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR (COM VALIDAÇÃO)
router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);

  } catch (error) {
    if (error.issues) {
      const mensagens = error.issues.map(i => `${i.path[0]}: ${i.message}`).join(' | ');
      return res.status(400).json({ error: mensagens });
    }
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usina excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
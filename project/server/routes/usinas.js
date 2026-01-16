import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// LISTAR TODAS AS USINAS
router.get('/', async (req, res) => {
  try {
    // USAR NOMES EM MINÚSCULO (Regra do Postgres/Supabase)
    const { data, error } = await supabase
      .from('usinas') // nome da tabela em minúsculo
      .select('*')
      .order('nomeproprietario'); // coluna em minúsculo

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ 
      erro: "Erro ao consultar banco de dados",
      mensagem_tecnica: error.message
    });
  }
});

// BUSCAR UMA USINA
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('usinaid', req.params.id) // coluna id em minúsculo
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LISTAR VÍNCULOS
router.get('/:id/vinculos', async (req, res) => {
  try {
    // Ajustado para os nomes que o Postgres usa internamente
    const { data, error } = await supabase
      .from('vinculos')
      .select('*, consumidores(nome), status(descricao)') 
      .eq('usinaid', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.parse(req.body);
    const { data, error } = await supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);
    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('usinaid', req.params.id)
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
  try {
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('usinaid', req.params.id);
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
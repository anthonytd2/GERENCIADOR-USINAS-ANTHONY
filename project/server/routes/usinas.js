import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// LISTAR
router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Removi ', concessionarias(nome)' pois a tabela ou a relação não existe ainda.
    const { data, error } = await supabase
      .from('usinas')
      .select('*') 
      .order('NomeProprietario');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    // Dica: Olhe os logs do Render para ver a mensagem real do erro (ex: relation does not exist)
    console.error("Erro ao listar usinas:", error);
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UMA (Detalhe)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      // CORREÇÃO: O seu banco usa 'UsinaID' (provavelmente 'usinaid' no Postgres), não 'id'
      .eq('usinaid', req.params.id) 
      .single();

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
    if (error.issues) {
      const mensagens = error.issues.map(i => `${i.path[0]}: ${i.message}`).join(' | ');
      return res.status(400).json({ error: mensagens });
    }
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
      // CORREÇÃO: Usar 'usinaid' em vez de 'id'
      .eq('usinaid', req.params.id) 
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
      // CORREÇÃO: Usar 'usinaid' em vez de 'id'
      .eq('usinaid', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usina excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
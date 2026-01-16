import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS AS USINAS
router.get('/', async (req, res) => {
  try {
    // CORREÇÃO: Removemos a tentativa de buscar concessionárias que não existem
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .order('NomeProprietario');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA USINA (Detalhe)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      // CORREÇÃO: Usamos 'usinaid' (como está no banco) em vez de 'id'
      .eq('usinaid', req.params.id) 
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. NOVO: LISTAR VÍNCULOS DA USINA (Resolve o erro 404)
router.get('/:id/vinculos', async (req, res) => {
  try {
    // Busca na tabela 'vinculos' onde o 'usinaid' é igual ao id da URL
    // Traz também os dados das tabelas 'consumidores' e 'status'
    const { data, error } = await supabase
      .from('vinculos')
      .select('*, Consumidores(Nome), Status(Descricao)') 
      .eq('usinaid', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar vínculos:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. CRIAR USINA
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

// 5. ATUALIZAR USINA
router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('usinaid', req.params.id) // CORREÇÃO: usinaid
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

// 6. EXCLUIR USINA
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('usinaid', req.params.id); // CORREÇÃO: usinaid

    if (error) throw error;
    res.json({ message: 'Usina excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
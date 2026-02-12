import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar consumidores:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UM (DETALHE)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      // CORREÇÃO: Usando 'consumidor_id' conforme seu SQL
      .eq('consumidor_id', id) 
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Consumidor não encontrado' });
      }
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar consumidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. CRIAR
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar consumidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    const { data, error } = await supabase
      .from('consumidores')
      .update(req.body)
      // CORREÇÃO: Usando 'consumidor_id'
      .eq('consumidor_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar consumidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Verificação de Segurança (Vínculos)
    // A chave estrangeira na tabela de vinculos costuma ser 'consumidor_id'
    const { data: vinculos, error: errCheck } = await supabase
      .from('vinculos')
      .select('vinculo_id') // Supondo que vinculo tenha vinculo_id ou id
      .eq('consumidor_id', id);

    if (errCheck && errCheck.code !== 'PGRST116') throw errCheck;

    if (vinculos && vinculos.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir: Cliente possui contratos ativos.' 
      });
    }

    const { error } = await supabase
      .from('consumidores')
      .delete()
      // CORREÇÃO: Usando 'consumidor_id'
      .eq('consumidor_id', id);

    if (error) throw error;
    res.json({ message: 'Consumidor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar consumidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================
// ROTAS DE FILIAIS (UNIDADES CONSUMIDORAS)
// =========================================

// 6. LISTAR TODAS AS UCs DO CLIENTE
router.get('/:id/unidades', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from('unidades_consumidoras')
      .select('*')
      // CORREÇÃO: A chave estrangeira aqui deve ser 'consumidor_id'
      .eq('consumidor_id', id) 
      .order('id', { ascending: true }); // Assumindo que UCs tem 'id' normal

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar UCs:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. CRIAR NOVA UC
router.post('/:id/unidades', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const novaUC = { ...req.body, consumidor_id: id };

    const { data, error } = await supabase
      .from('unidades_consumidoras')
      .insert([novaUC])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar UC:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. ATUALIZAR UC
router.put('/unidades/:ucId', async (req, res) => {
  try {
    const ucId = Number(req.params.ucId);

    const { data, error } = await supabase
      .from('unidades_consumidoras')
      .update(req.body)
      .eq('id', ucId) // Assumindo que UC usa 'id'
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar UC:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. DELETAR UC
router.delete('/unidades/:ucId', async (req, res) => {
  try {
    const ucId = Number(req.params.ucId);

    const { error } = await supabase
      .from('unidades_consumidoras')
      .delete()
      .eq('id', ucId); // Assumindo que UC usa 'id'

    if (error) throw error;
    res.json({ message: 'Unidade removida' });
  } catch (error) {
    console.error('Erro ao deletar UC:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
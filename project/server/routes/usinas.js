import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS
router.get('/', async (req, res) => {
  try {
    // Busca usinas e seus vínculos (onde vinculo tem coluna 'id')
    const { data, error } = await supabase
      .from('usinas')
      .select('*, vinculos(id)');

    if (error) throw error;

    const usinasFormatadas = data.map(usina => ({
      ...usina,
      // O frontend antigo pode esperar 'usina_id', então fazemos um alias se precisar
      // mas o principal é manter o objeto original.
      is_locada: usina.vinculos && usina.vinculos.length > 0
    }));

    usinasFormatadas.sort((a, b) => 
      (a.nome || '').localeCompare(b.nome || '')
    );

    res.json(usinasFormatadas);
  } catch (error) {
    console.error("Erro ao listar usinas:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('id', req.params.id) // CORRETO: A chave é 'id'
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. VÍNCULOS DA USINA
router.get('/:id/vinculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select('*, consumidores(nome), status(descricao)')
      // CORRETO: Na tabela vinculos, a coluna que aponta pra usina é 'usina_id'
      .eq('usina_id', req.params.id); 

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. CRIAR (POST)
router.post('/', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.parse(req.body);

    const { data, error } = await supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) {
      console.error("ERRO SUPABASE (CRIAR):", error.message);
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error("ERRO SERVIDOR (CRIAR):", error);
    const msg = error.issues ? 'Dados inválidos' : error.message;
    res.status(500).json({ error: msg });
  }
});

// 5. ATUALIZAR (PUT)
router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('id', req.params.id) // CORRETO: id
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('usinas')
      .delete()
      .eq('id', req.params.id); // CORRETO: id

    if (error) throw error;
    res.json({ message: 'Usina excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
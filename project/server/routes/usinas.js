import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS (Apenas as não deletadas)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*, vinculos(id)')
      .is('deleted_at', null); // 🟢 Filtro do Soft Delete

    if (error) throw error;

    const usinasFormatadas = data.map(usina => ({
      ...usina,
      is_locada: usina.vinculos && usina.vinculos.length > 0
    }));

    usinasFormatadas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    res.json(usinasFormatadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('id', req.params.id)
      .is('deleted_at', null) // Impede acesso direto via URL a uma apagada
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
      .eq('usina_id', req.params.id)
      .is('deleted_at', null); // 🟢 Filtro do Soft Delete nos vínculos

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

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Erro na operação da usina:", error);

    // 1. Erro de Validação do Zod
    if (error.issues) {
      return res.status(400).json({ error: 'Dados inválidos. Verifique os campos.', detalhes: error.issues });
    }

    // 2. Erro de Duplicidade do Banco (Ex: Documento ou UC já existente)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma Usina cadastrada com este Documento ou Número de UC.' });
    }

    // 3. Erro genérico
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 5. ATUALIZAR (PUT)
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
    console.error("Erro na operação da usina:", error);

    // 1. Erro de Validação do Zod
    if (error.issues) {
      return res.status(400).json({ error: 'Dados inválidos. Verifique os campos.', detalhes: error.issues });
    }

    // 2. Erro de Duplicidade do Banco (Ex: Documento ou UC já existente)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma Usina cadastrada com este Documento ou Número de UC.' });
    }

    // 3. Erro genérico
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 6. EXCLUIR (🟢 SOFT DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('usinas')
      .update({ deleted_at: new Date().toISOString() }) // Ao invés de .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usina movida para lixeira (Soft Delete)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
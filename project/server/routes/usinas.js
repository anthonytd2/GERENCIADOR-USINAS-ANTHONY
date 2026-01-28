import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*, vinculos(vinculo_id)');

    if (error) throw error;

    const usinasFormatadas = data.map(usina => ({
      ...usina,
      is_locada: usina.vinculos && usina.vinculos.length > 0
    }));

    usinasFormatadas.sort((a, b) => 
      (a.nome_proprietario || '').localeCompare(b.nome_proprietario || '')
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
      .eq('usina_id', req.params.id)
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
      .eq('usina_id', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. CRIAR (POST) - AQUI ESTÁ A ALTERAÇÃO IMPORTANTE
router.post('/', async (req, res) => {
  try {
    // O schema limpa os dados, mas pode estar desatualizado
    const dadosLimpos = usinaSchema.parse(req.body);

    // --- FORÇAR A INCLUSÃO DOS CAMPOS NOVOS ---
    if (req.body.cpf_cnpj !== undefined) dadosLimpos.cpf_cnpj = req.body.cpf_cnpj;
    if (req.body.endereco_proprietario !== undefined) dadosLimpos.endereco_proprietario = req.body.endereco_proprietario;
    // -------------------------------------------

    const { data, error } = await supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    const msg = error.issues ? error.issues.map(i => i.message).join(' | ') : error.message;
    res.status(500).json({ error: msg });
  }
});

// 5. ATUALIZAR (PUT) - AQUI TAMBÉM
router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);

    // --- FORÇAR A INCLUSÃO DOS CAMPOS NOVOS NA EDIÇÃO ---
    if (req.body.cpf_cnpj !== undefined) dadosLimpos.cpf_cnpj = req.body.cpf_cnpj;
    if (req.body.endereco_proprietario !== undefined) dadosLimpos.endereco_proprietario = req.body.endereco_proprietario;
    // ----------------------------------------------------

    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('usina_id', req.params.id)
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
      .eq('usina_id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usina excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*, vinculos(id)');

    if (error) throw error;

    const usinasFormatadas = data.map(usina => ({
      ...usina,
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
      .eq('id', req.params.id)
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

// 4. CRIAR (POST)
router.post('/', async (req, res) => {
  try {
    // Tenta validar, mas se o schema estiver incompleto, pode perder dados
    const dadosLimpos = usinaSchema.parse(req.body);

    // FIX: Se o schema limpar o tipo_pagamento, reinserimos manualmente
    if (req.body.tipo_pagamento) {
        dadosLimpos.tipo_pagamento = req.body.tipo_pagamento;
    }
    if (req.body.endereco_proprietario) {
        dadosLimpos.endereco_proprietario = req.body.endereco_proprietario;
    }

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

// 5. ATUALIZAR (PUT) - AQUI ESTAVA O PROBLEMA
router.put('/:id', async (req, res) => {
  try {
    // 1. O Schema filtra os dados
    let dadosLimpos = usinaSchema.partial().parse(req.body);

    // 2. CORREÇÃO FORÇADA:
    // Se o schema removeu o 'tipo_pagamento' ou 'endereco_proprietario', 
    // nós os colocamos de volta manualmente se eles vieram no req.body.
    
    if (req.body.tipo_pagamento !== undefined) {
        dadosLimpos.tipo_pagamento = req.body.tipo_pagamento;
    }
    
    if (req.body.endereco_proprietario !== undefined) {
        dadosLimpos.endereco_proprietario = req.body.endereco_proprietario;
    }

    console.log("Atualizando Usina ID:", req.params.id);
    console.log("Dados enviados ao banco:", dadosLimpos); // Para você ver no terminal se está indo

    const { data, error } = await supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro update:", error);
    res.status(500).json({ error: error.message });
  }
});

// 6. EXCLUIR
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
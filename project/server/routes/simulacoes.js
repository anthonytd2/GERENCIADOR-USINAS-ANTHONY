import express from 'express';
import { supabase } from '../db.js';
import xss from 'xss';

const router = express.Router();

// 🟢 Função de Segurança (Varredor de XSS)
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// ==========================================
// ROTAS DE SIMULAÇÕES
// ==========================================

// 1. LISTAR TODAS (Para a tela inicial do módulo)
// 1. LISTAR TODAS (Para a tela inicial do módulo)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('simulacoes')
      .select(`
        id, titulo_simulacao, cliente_avulso, usina_avulsa, consumidor_id, usina_id, dados_mensais, created_at,
        consumidores (nome),
        usinas (nome)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar simulações:', error);
    res.status(500).json({ error: 'Erro ao buscar simulações' });
  }
});

// 2. BUSCAR UMA DETALHADA (Para quando for abrir uma salva)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('simulacoes')
      .select(`
        *,
        consumidores (*),
        usinas (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Simulação não encontrada' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes da simulação' });
  }
});

// 3. SALVAR NOVA SIMULAÇÃO
router.post('/', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);

    const payload = {
      titulo_simulacao: body.titulo_simulacao,
      cliente_avulso: body.cliente_avulso || null,
      usina_avulsa: body.usina_avulsa || null,
      consumidor_id: body.consumidor_id || null,
      usina_id: body.usina_id || null,
      dados_mensais: body.dados_mensais || [] // O array com os meses
    };

    const { data, error } = await supabase
      .from('simulacoes')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar simulação:', error);
    res.status(500).json({ error: 'Erro ao salvar simulação' });
  }
});

// 4. ATUALIZAR SIMULAÇÃO EXISTENTE
router.put('/:id', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);

    const payload = {
      titulo_simulacao: body.titulo_simulacao,
      cliente_avulso: body.cliente_avulso || null,
      usina_avulsa: body.usina_avulsa || null,
      consumidor_id: body.consumidor_id || null,
      usina_id: body.usina_id || null,
      dados_mensais: body.dados_mensais || [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await req.supabase
      .from('simulacoes')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar simulação' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('simulacoes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

export default router;
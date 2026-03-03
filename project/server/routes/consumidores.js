import express from 'express';
import { supabase } from '../db.js';
import { consumidorSchema } from '../validators/schemas.js';
import xss from 'xss'; // 🟢 NOVO: Importando a biblioteca de sanitização

const router = express.Router();

// 🟢 NOVO: Função de Segurança (Varredor de XSS)
// Ela olha para todos os campos recebidos e "limpa" qualquer tag de script ou código HTML malicioso
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value); // Arranca scripts invisíveis do texto
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value); // Varre objetos dentro de objetos
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// 1. LISTAR TODOS (Mantém supabase global)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .is('deleted_at', null)
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar consumidores:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UM (DETALHE) (Mantém supabase global)
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .eq('consumidor_id', id)
      .is('deleted_at', null)
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

// 3. CRIAR (🟢 MUDOU PARA req.supabase)
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpa o req.body ANTES do Zod validar
    const dadosLimpos = consumidorSchema.parse(sanitizeInput(req.body));

    const { data, error } = await req.supabase
      .from('consumidores')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
} catch (error) {
    console.error("Erro na operação:", error);
    if (error.issues) return res.status(400).json({ error: 'Dados inválidos.', detalhes: error.issues });
    if (error.code === '23505') return res.status(400).json({ error: 'Este CPF/CNPJ ou e-mail já está cadastrado no sistema.' });
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 4. ATUALIZAR (🟢 MUDOU PARA req.supabase)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // 🟢 SEGURANÇA APLICADA: Limpa o req.body ANTES do Zod validar
    const dadosLimpos = consumidorSchema.partial().parse(sanitizeInput(req.body));

    const { data, error } = await req.supabase
      .from('consumidores')
      .update(dadosLimpos)
      .eq('consumidor_id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro na operação:", error);
    if (error.issues) return res.status(400).json({ error: 'Dados inválidos.', detalhes: error.issues });
    if (error.code === '23505') return res.status(400).json({ error: 'Este CPF/CNPJ ou e-mail já está cadastrado no sistema.' });
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 5. DELETAR / SOFT DELETE (🟢 MUDOU PARA req.supabase)
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Verificação de Segurança (Vínculos Ativos) - Mantém global pois é só leitura
    const { data: vinculos, error: errCheck } = await supabase
      .from('vinculos')
      .select('id')
      .eq('consumidor_id', id)
      .is('deleted_at', null);

    if (errCheck && errCheck.code !== 'PGRST116') throw errCheck;

    if (vinculos && vinculos.length > 0) {
      return res.status(400).json({
        error: 'Não é possível excluir: Cliente possui contratos ativos.'
      });
    }

    const { error } = await req.supabase
      .from('consumidores')
      .update({ deleted_at: new Date().toISOString() })
      .eq('consumidor_id', id);

    if (error) throw error;
    res.json({ message: 'Consumidor movido para lixeira' });
  } catch (error) {
    console.error('Erro ao deletar consumidor:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. LISTAR TODAS AS UCs DO CLIENTE (Mantém supabase global)
router.get('/:id/unidades', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { data, error } = await supabase
      .from('unidades_consumidoras')
      .select('*')
      .eq('consumidor_id', id)
      .order('id', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar UCs:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. CRIAR NOVA UC (🟢 MUDOU PARA req.supabase)
router.post('/:id/unidades', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // 🟢 SEGURANÇA APLICADA: Aqui o req.body ia direto pro banco, agora passa pelo filtro
    const novaUC = { ...sanitizeInput(req.body), consumidor_id: id };

    const { data, error } = await req.supabase
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

// 8. ATUALIZAR UC (🟢 MUDOU PARA req.supabase)
router.put('/unidades/:ucId', async (req, res) => {
  try {
    const ucId = Number(req.params.ucId);

    // 🟢 SEGURANÇA APLICADA: Limpa antes de atualizar no banco
    const dadosLimpos = sanitizeInput(req.body);

    const { data, error } = await req.supabase
      .from('unidades_consumidoras')
      .update(dadosLimpos)
      .eq('id', ucId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar UC:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. DELETAR UC (🟢 MUDOU PARA req.supabase)
router.delete('/unidades/:ucId', async (req, res) => {
  try {
    const ucId = Number(req.params.ucId);

    const { error } = await req.supabase
      .from('unidades_consumidoras')
      .delete()
      .eq('id', ucId);

    if (error) throw error;
    res.json({ message: 'Unidade removida' });
  } catch (error) {
    console.error('Erro ao deletar UC:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
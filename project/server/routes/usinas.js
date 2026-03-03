import express from 'express';
import { supabase } from '../db.js'; // Mantemos para o GET
import { usinaSchema } from '../validators/schemas.js';
import xss from 'xss'; // 🟢 NOVO: Importando a biblioteca de sanitização

const router = express.Router();

// 🟢 NOVO: Função de Segurança (Varredor de XSS)
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

// 1. LISTAR TODAS (Mantemos o supabase global aqui pois é só leitura)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*, vinculos(id)')
      .is('deleted_at', null);

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
      .is('deleted_at', null)
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
      .is('deleted_at', null);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. CRIAR (POST)
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpa o req.body ANTES do Zod validar
    const dadosLimpos = usinaSchema.parse(sanitizeInput(req.body));

    // 🟢 MUDANÇA: Usando req.supabase
    const { data, error } = await req.supabase
      .from('usinas')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Erro na operação da usina:", error);
    if (error.issues) return res.status(400).json({ error: 'Dados inválidos. Verifique os campos.', detalhes: error.issues });
    if (error.code === '23505') return res.status(400).json({ error: 'Já existe uma Usina cadastrada com este Documento ou Número de UC.' });
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 5. ATUALIZAR (PUT)
router.put('/:id', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpa o req.body ANTES do Zod validar
    const dadosLimpos = usinaSchema.partial().parse(sanitizeInput(req.body));

    // 🟢 MUDANÇA: Usando req.supabase
    const { data, error } = await req.supabase
      .from('usinas')
      .update(dadosLimpos)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro na operação da usina:", error);
    if (error.issues) return res.status(400).json({ error: 'Dados inválidos. Verifique os campos.', detalhes: error.issues });
    if (error.code === '23505') return res.status(400).json({ error: 'Já existe uma Usina cadastrada com este Documento ou Número de UC.' });
    res.status(500).json({ error: 'Erro interno no servidor.', detalhes: error.message });
  }
});

// 6. EXCLUIR (SOFT DELETE)
router.delete('/:id', async (req, res) => {
  try {
    // 🟢 MUDANÇA: Usando req.supabase
    const { error } = await req.supabase
      .from('usinas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Usina movida para lixeira (Soft Delete)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';
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

// 1. LISTAR TUDO (Para o Kanban)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('protocolos')
      .select('*')
      .order('data_limite', { ascending: true }); // Ordena pelos que vencem antes

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CRIAR NOVO CARD
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpa todos os textos antes de montar o card
    const dadosLimpos = sanitizeInput(req.body);
    const { titulo, cliente, data_limite, numero_protocolo, descricao, status } = dadosLimpos;
    
    const { data, error } = await supabase
      .from('protocolos')
      .insert([{
        titulo,
        cliente,
        data_limite: data_limite || null,
        numero_protocolo,
        descricao,
        status: status || 'A_FAZER'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ATUALIZAR (Mover Card ou Editar Dados)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 🟢 SEGURANÇA APLICADA: Limpa todos os textos antes de atualizar o card
    const body = sanitizeInput(req.body);

    const payload = {};
    if (body.status) payload.status = body.status;
    if (body.titulo) payload.titulo = body.titulo;
    if (body.cliente) payload.cliente = body.cliente;
    if (body.data_limite) payload.data_limite = body.data_limite;
    if (body.numero_protocolo) payload.numero_protocolo = body.numero_protocolo;
    if (body.descricao !== undefined) payload.descricao = body.descricao;

    const { data, error } = await supabase
      .from('protocolos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. EXCLUIR CARD
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('protocolos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Protocolo excluído' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
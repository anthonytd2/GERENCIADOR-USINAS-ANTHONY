import express from 'express';
import { supabase } from '../db.js';
import xss from 'xss'; 

const router = express.Router();

// Função de Segurança (Varredor de XSS)
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
      .order('data_limite', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CRIAR NOVO CARD
router.post('/', async (req, res) => {
  try {
    const dadosLimpos = sanitizeInput(req.body);
    const { titulo, cliente, data_limite, numero_protocolo, descricao, status } = dadosLimpos;
    
    const { data, error } = await supabase
      .from('protocolos')
      .insert([{
        titulo,
        cliente: cliente === '' ? null : cliente,
        data_limite: data_limite === '' ? null : data_limite,
        numero_protocolo: numero_protocolo === '' ? null : numero_protocolo,
        descricao: descricao === '' ? null : descricao,
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

// 3. ATUALIZAR (Mover Card ou Editar/Apagar Dados)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeInput(req.body);
    const payload = {};

    // 🟢 CORREÇÃO: Agora o backend aceita strings vazias e transforma em "null" no banco para apagar a informação.
    if (body.status !== undefined) payload.status = body.status;
    if (body.titulo !== undefined) payload.titulo = body.titulo;
    
    // Se vier vazio (''), transforma em null e apaga do banco. Se tiver texto, salva o texto.
    if (body.cliente !== undefined) payload.cliente = body.cliente === '' ? null : body.cliente;
    if (body.data_limite !== undefined) payload.data_limite = body.data_limite === '' ? null : body.data_limite;
    if (body.numero_protocolo !== undefined) payload.numero_protocolo = body.numero_protocolo === '' ? null : body.numero_protocolo;
    if (body.descricao !== undefined) payload.descricao = body.descricao === '' ? null : body.descricao;

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

// 4. EXCLUIR CARD (Manteve-se igual, já estava correto)
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
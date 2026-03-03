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

// LISTAR
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('entidades')
      .select('*')
      .order('nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CADASTRAR (Padronizado com .single())
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpamos o req.body antes de extrair as variáveis
    const dadosLimpos = sanitizeInput(req.body);
    const { nome, cpf_cnpj, endereco, cidade, uf } = dadosLimpos;
    
    const { data, error } = await supabase
      .from('entidades')
      .insert([{ nome, cpf_cnpj, endereco, cidade, uf }])
      .select()
      .single(); // Garante que retorna um objeto, não um array

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('entidades').delete().eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';
import { consumidorSchema } from '../validators/schemas.js'; // Importa as regras de validação

const router = express.Router();

// LISTAR TODOS OS CONSUMIDORES
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .order('Nome');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UM CONSUMIDOR (Detalhes)
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('consumidores')
      .select('*')
      .eq('ConsumidorID', req.params.id) // Atenção: Seu banco usa ConsumidorID
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR NOVO CONSUMIDOR (COM VALIDAÇÃO)
router.post('/', async (req, res) => {
  try {
    // 1. BLINDAGEM: O Zod verifica se os dados estão corretos
    // Se estiver errado, ele trava aqui e joga pro 'catch'
    const dadosLimpos = consumidorSchema.parse(req.body);

    // 2. Se passou na validação, salva no banco
    const { data, error } = await supabase
      .from('consumidores')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);

  } catch (error) {
    // Tratamento de erro específico para Validação
    if (error.issues) {
      // Cria uma mensagem amigável: "Nome: obrigatório | Email: inválido"
      const mensagens = error.issues.map(i => `${i.path[0]}: ${i.message}`).join(' | ');
      return res.status(400).json({ error: mensagens });
    }
    
    // Erro genérico do servidor
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR CONSUMIDOR (COM VALIDAÇÃO PARCIAL)
router.put('/:id', async (req, res) => {
  try {
    // .partial() permite validar apenas os campos enviados (ex: mudar só o telefone)
    const dadosLimpos = consumidorSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('consumidores')
      .update(dadosLimpos)
      .eq('ConsumidorID', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);

  } catch (error) {
    if (error.issues) {
      const mensagens = error.issues.map(i => `${i.path[0]}: ${i.message}`).join(' | ');
      return res.status(400).json({ error: mensagens });
    }
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR CONSUMIDOR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('consumidores')
      .delete()
      .eq('ConsumidorID', req.params.id);

    if (error) throw error;
    res.json({ message: 'Consumidor excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
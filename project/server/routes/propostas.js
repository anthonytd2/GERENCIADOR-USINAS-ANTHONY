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

// 1. LISTAR TODAS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA POR ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CRIAR
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Lavamos os dados recebidos antes de extrair
    const dadosLimpos = sanitizeInput(req.body);

    // 🟢 CORREÇÃO: Em vez de desestruturar, enviamos o objeto limpo direto.
    // O Supabase vai ignorar o que não pertence à tabela automaticamente.
    const { data, error } = await supabase
      .from('propostas')
      .insert([dadosLimpos])
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase ao criar proposta:", error);
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    console.error("Erro interno no POST /propostas:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Lavamos os dados recebidos antes de atualizar
    const dadosLimpos = sanitizeInput(req.body);
    
    // Adicionamos a data de atualização
    dadosLimpos.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('propostas')
      .update(dadosLimpos) 
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase ao atualizar proposta:", error);
      throw error;
    }
    
    res.json(data);
  } catch (error) {
    console.error("Erro interno no PUT /propostas:", error);
    res.status(500).json({ error: error.message });
  }
});

// 5. EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('propostas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Proposta excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 6. CONVERTER EM VENDA (CORRIGIDO)
// =====================================================
router.post('/:id/converter', async (req, res) => {
  try {
    const idProposta = req.params.id;

    // A. Buscar dados da proposta
    const { data: proposta, error: errProp } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', idProposta)
      .single();

    if (errProp) throw errProp;

    // B. Preparar dados do Consumidor
    // CORREÇÃO: Removemos 'email' e 'telefone' diretos pois a tabela não tem essas colunas.
    // Salvamos na observação para não perder.
    const obsContato = `Convertido de Proposta. Contato: ${proposta.telefone || '-'} | Email: ${proposta.email || '-'}`;

    const novoConsumidor = {
      nome: proposta.nome_cliente_prospect,
      documento: proposta.documento || proposta.cpf_cnpj || 'A DEFINIR',
      endereco: proposta.endereco || null,
      cidade: proposta.cidade || null,
      uf: proposta.uf || 'PR',
      // REMOVIDOS: telefone e email (pois colunas não existem no consumidor)
      observacao: obsContato, 
      media_consumo: proposta.consumo_media_kwh || 0,
      tipo_desconto: 'porcentagem',
      percentual_desconto: 10, 
      unidade_consumidora: 'A DEFINIR'
    };

    // C. Criar o Consumidor
    const { data: consumidor, error: errCons } = await supabase
      .from('consumidores')
      .insert([novoConsumidor])
      .select()
      .single();

    if (errCons) {
      console.error("Erro ao criar consumidor:", errCons);
      throw new Error(`Erro ao criar consumidor: ${errCons.message}`);
    }

    // D. Atualizar status da proposta
    await supabase
      .from('propostas')
      .update({ 
          status: 'FECHADO', 
          consumidor_id: consumidor.consumidor_id 
      })
      .eq('id', idProposta);

    res.json({ 
      message: 'Conversão realizada com sucesso!', 
      consumidor_id: consumidor.consumidor_id 
    });

  } catch (error) {
    console.error("Erro na conversão:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODAS
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

// --- NOVO: BUSCAR UMA POR ID (Para editar) ---
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

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { consumidor_id, nome_cliente_prospect, concessionaria_id, dados_simulacao, status } = req.body;

    const { data, error } = await supabase
      .from('propostas')
      .insert([{
        consumidor_id,
        nome_cliente_prospect,
        concessionaria_id,
        dados_simulacao,
        status
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ATUALIZAR (Versão Corrigida - Aceita Dados e Status)
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    
    // Monta o objeto com tudo que pode ser atualizado
    const payload = {
      updated_at: new Date()
    };

    // Só adiciona ao pacote se o dado foi enviado
    if (body.status) payload.status = body.status;
    if (body.dados_simulacao) payload.dados_simulacao = body.dados_simulacao; // <--- O IMPORTANTE ESTÁ AQUI
    if (body.nome_cliente_prospect) payload.nome_cliente_prospect = body.nome_cliente_prospect;
    if (body.consumidor_id) payload.consumidor_id = body.consumidor_id;
    if (body.concessionaria_id) payload.concessionaria_id = body.concessionaria_id;

    const { data, error } = await supabase
      .from('propostas')
      .update(payload) 
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOVO: CONVERTER PROPOSTA EM CLIENTE ---
router.post('/:id/converter', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Busca a proposta original
    const { data: proposta, error: erroProposta } = await supabase
      .from('propostas').select('*').eq('id', id).single();
    if (erroProposta) throw erroProposta;

    const simulacao = proposta.dados_simulacao || {};
    const usinaId = simulacao.usinaSelecionada?.id;
    const desconto = simulacao.percentualDesconto || 0;

    // 2. Cria ou Recupera Consumidor
    let consumidorId = proposta.consumidor_id;
    if (!consumidorId) {
      const { data: novoConsumidor, error: erroConsumidor } = await supabase
        .from('consumidores')
        .insert([{
          nome: proposta.nome_cliente_prospect,
          unidade_consumidora: 'A DEFINIR',
          documento: 'A DEFINIR'
        }]).select().single();
      if (erroConsumidor) throw erroConsumidor;
      consumidorId = novoConsumidor.consumidor_id;
    }

    // 3. Cria o Vínculo (Contrato)
    if (usinaId) {
      const { error: erroVinculo } = await supabase
        .from('vinculos').insert([{
          consumidor_id: consumidorId,
          usina_id: usinaId,
          percentual_desconto: desconto,
          status_id: 1 // 1 = Ativo
        }]);
      if (erroVinculo) throw erroVinculo;
    }

    // 4. Marca Proposta como FECHADO
    await supabase.from('propostas').update({ status: 'FECHADO', consumidor_id: consumidorId }).eq('id', id);

    res.json({ message: 'Sucesso! Cliente criado.', consumidor_id: consumidorId });

  } catch (error) {
    console.error('Erro conversão:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
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

export default router;
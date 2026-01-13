import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR
router.get('/:vinculoId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fechamentos')
      .select('*')
      .eq('vinculoid', req.params.vinculoId) // Nota: vinculoid minúsculo
      .order('mesreferencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR (CORRIGIDO: Mapeamento de Maiúsculo para Minúsculo)
router.post('/', async (req, res) => {
  try {
    const { 
      MesReferencia, EnergiaCompensada, ValorRecebido, 
      ValorPago, Spread, ArquivoURL, ReciboURL, VinculoID 
    } = req.body;

    // Cria um objeto com as chaves em minúsculo para o Supabase
    const payload = {
      mesreferencia: MesReferencia,
      energiacompensada: EnergiaCompensada,
      valorrecebido: ValorRecebido,
      valorpago: ValorPago,
      spread: Spread,
      arquivourl: ArquivoURL, // Pode ser null
      recibourl: ReciboURL,   // Pode ser null
      vinculoid: VinculoID
    };

    const { data, error } = await supabase
      .from('fechamentos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar fechamento:', error);
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      MesReferencia, EnergiaCompensada, ValorRecebido, 
      ValorPago, Spread, ArquivoURL, ReciboURL 
    } = req.body;

    // 1. Monta o objeto básico (minúsculo)
    const payload = {
      mesreferencia: MesReferencia,
      energiacompensada: EnergiaCompensada,
      valorrecebido: ValorRecebido,
      valorpago: ValorPago,
      spread: Spread,
      updated_at: new Date()
    };

    // 2. Só atualiza as URLs se elas foram enviadas (para permitir remover se for null)
    if (ArquivoURL !== undefined) payload.arquivourl = ArquivoURL;
    if (ReciboURL !== undefined) payload.recibourl = ReciboURL;

    // 3. Tenta atualizar
    let { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamentoid', id)
      .select()
      .single();

    // 4. Fallback caso a coluna updated_at não exista no banco
    if (error && error.message.includes('updated_at')) {
       delete payload.updated_at; 
       const retry = await supabase
         .from('fechamentos')
         .update(payload)
         .eq('fechamentoid', id)
         .select()
         .single();
         
       data = retry.data;
       error = retry.error;
    }

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('fechamentos')
      .delete()
      .eq('fechamentoid', req.params.id);
      
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

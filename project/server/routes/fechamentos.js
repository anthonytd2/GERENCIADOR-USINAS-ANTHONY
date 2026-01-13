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

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('fechamentos').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR (Correção do Erro 500)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      MesReferencia, EnergiaCompensada, ValorRecebido, 
      ValorPago, Spread, ArquivoURL, ReciboURL 
    } = req.body;

    // 1. Monta o objeto básico (usando nomes minúsculos que funcionam no Postgres)
    const payload = {
      mesreferencia: MesReferencia,
      energiacompensada: EnergiaCompensada,
      valorrecebido: ValorRecebido,
      valorpago: ValorPago,
      spread: Spread,
      updated_at: new Date() // Requer que a coluna exista! (Passo 1)
    };

    // 2. Só atualiza as URLs se elas foram enviadas no corpo da requisição
    // Se receber null, grava null (remove o arquivo). Se undefined, ignora.
    if (ArquivoURL !== undefined) payload.arquivourl = ArquivoURL;
    if (ReciboURL !== undefined) payload.recibourl = ReciboURL;

    // 3. Tenta atualizar
    let { data, error } = await supabase
      .from('fechamentos')
      .update(payload)
      .eq('fechamentoid', id) // Tenta ID minúsculo
      .select()
      .single();

    // 4. Se der erro (ex: coluna updated_at não existe), tenta sem ela como fallback
    if (error) {
       console.warn("Tentando fallback sem updated_at...");
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
    const { error } = await supabase.from('fechamentos').delete().eq('fechamentoid', req.params.id);
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
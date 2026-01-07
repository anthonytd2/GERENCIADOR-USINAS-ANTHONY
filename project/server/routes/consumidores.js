import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('Consumidores').select('*').order('Nome');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('Consumidores').select('*').eq('ConsumidorID', req.params.id).single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Não encontrado' });
  res.json(data);
});

router.post('/', async (req, res) => {
  try {
    // ATUALIZADO: Incluindo Documento e Endereço completo
    const { 
      Nome, MediaConsumo, PercentualDesconto, TipoDesconto, 
      TempoContratoAnos, InicioContrato, VencimentoContrato, 
      Vendedor, Observacao,
      Documento, Endereco, Bairro, Cidade, UF, CEP 
    } = req.body;
    
    const { data, error } = await supabase
      .from('Consumidores')
      .insert([{ 
        Nome, MediaConsumo, PercentualDesconto, TipoDesconto, 
        TempoContratoAnos, InicioContrato, VencimentoContrato, 
        Vendedor, Observacao,
        Documento, Endereco, Bairro, Cidade, UF, CEP 
      }])
      .select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    // O update é inteligente: ele pega tudo que vier no corpo da requisição (req.body)
    const { data, error } = await supabase
      .from('Consumidores')
      .update(req.body) 
      .eq('ConsumidorID', req.params.id)
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('Consumidores').delete().eq('ConsumidorID', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
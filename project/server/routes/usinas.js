import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// LISTAR TODAS (OTIMIZADO)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas') 
      .select(`
        UsinaID,
        NomeProprietario,
        Potencia,
        Tipo,
        ValorKWBruto,
        GeracaoEstimada,
        vinculos ( VinculoID, StatusID )
      `) 
      .order('NomeProprietario');

    if (error) throw error;

    const usinasFormatadas = data.map(u => {
      const temVinculoAtivo = u.vinculos && u.vinculos.some(v => [1, 2].includes(v.StatusID));
      return {
        id: u.UsinaID,
        nome: u.NomeProprietario,
        potencia: u.Potencia,
        tipo: u.Tipo,
        valor_kw: u.ValorKWBruto,
        geracao: u.GeracaoEstimada,
        is_locada: temVinculoAtivo
      };
    });

    res.json(usinasFormatadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BUSCAR UMA (CORREÇÃO DO ERRO 500) ---
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('UsinaID', req.params.id)
      .maybeSingle(); // <--- MUDANÇA: maybeSingle não explode se não achar

    if (error) throw error;
    
    // Se não achou, retorna 404 bonitinho em vez de travar
    if (!data) return res.status(404).json({ error: 'Usina não encontrada' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR VÍNCULOS DESTA USINA
router.get('/:id/vinculos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        VinculoID,
        StatusID,
        consumidores ( Nome ),
        status ( Descricao )
      `)
      .eq('UsinaID', req.params.id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRIAR
router.post('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('usinas').insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('usinas').update(req.body).eq('UsinaID', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXCLUIR (Também adicionando proteção de cascata aqui) ---
router.delete('/:id', async (req, res) => {
  try {
    // 1. Limpa vínculos antes
    await supabase.from('vinculos').delete().eq('UsinaID', req.params.id);

    // 2. Deleta Usina
    const { error } = await supabase.from('usinas').delete().eq('UsinaID', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
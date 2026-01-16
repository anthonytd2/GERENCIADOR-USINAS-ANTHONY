import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- LISTAR VÍNCULOS (OTIMIZADO) ---
router.get('/', async (req, res) => {
  try {
    // O Supabase faz o cruzamento (JOIN) direto no banco. Muito mais rápido.
    // Trazemos apenas os campos necessários.
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        VinculoID,
        Percentual,
        DataInicio,
        StatusID,
        ConsumidorID,
        UsinaID,
        consumidores ( Nome ),
        usinas ( NomeProprietario ),
        status ( Descricao )
      `)
      .order('VinculoID', { ascending: false });

    if (error) throw error;

    // Formatamos para manter compatibilidade com seu Frontend
    const vinculosFormatados = data.map(v => ({
      id: v.VinculoID,
      consumidor_id: v.ConsumidorID,
      usina_id: v.UsinaID,
      status_id: v.StatusID,
      percentual: v.Percentual,
      data_inicio: v.DataInicio,
      // O Supabase retorna objetos aninhados (ex: consumidores.Nome)
      consumidor_nome: v.consumidores?.Nome || 'Desconhecido',
      usina_nome: v.usinas?.NomeProprietario || 'Desconhecida',
      status_nome: v.status?.Descricao || 'Indefinido'
    }));

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- ROTA DE DETALHES ---
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        consumidores (*),
        usinas (*),
        status (*)
      `)
      .eq('VinculoID', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vínculo não encontrado' });

    // Mantendo a estrutura que seu frontend espera
    const resultado = {
      ...data,
      id: data.VinculoID,
      consumidor: data.consumidores || {},
      usina: data.usinas || {},
      status: data.status || {}
    };

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CRIAR ---
router.post('/', async (req, res) => {
  try {
    const { ConsumidorID, UsinaID, Percentual, StatusID, Observacao } = req.body;
    const { data, error } = await supabase
      .from('vinculos')
      .insert([{ ConsumidorID, UsinaID, Percentual, StatusID, Observacao, DataInicio: new Date() }])
      .select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ATUALIZAR ---
router.put('/:id', async (req, res) => {
  try {
    const { Percentual, StatusID, Observacao } = req.body;
    const { data, error } = await supabase
      .from('vinculos')
      .update({ Percentual, StatusID, Observacao })
      .eq('VinculoID', req.params.id)
      .select().single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- EXCLUIR ---
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('vinculos').delete().eq('VinculoID', req.params.id);
    if (error) throw error;
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
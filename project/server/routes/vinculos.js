import express from 'express';
import { supabase } from '../db.js'; // Usa a conexão correta do Supabase

const router = express.Router();

// --- LISTAR TODOS OS VÍNCULOS ---
router.get('/', async (req, res) => {
  try {
    // Busca os vínculos e traz os dados das tabelas relacionadas (consumidores e usinas)
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        consumidores (*),
        usinas (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formata os dados para o formato que o Frontend espera
    const vinculosFormatados = data.map(vinculo => {
      // Tenta pegar o nome das tabelas relacionadas (verifica maiúsculas/minúsculas)
      const nomeConsumidor = vinculo.consumidores?.Nome || vinculo.consumidores?.nome || 'Consumidor não encontrado';
      const nomeUsina = vinculo.usinas?.Nome || vinculo.usinas?.nome || 'Usina não encontrada';
      
      // Define o nome do status baseado no ID
      let nomeStatus = 'Verificar';
      if (vinculo.status_id === 1) nomeStatus = 'Ativo';
      if (vinculo.status_id === 2) nomeStatus = 'Pendente';

      return {
        ...vinculo,
        consumidor_nome: nomeConsumidor,
        usina_nome: nomeUsina,
        status_nome: nomeStatus
      };
    });

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro ao buscar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculos: ' + error.message });
  }
});

// --- CRIAR NOVO VÍNCULO ---
router.post('/', async (req, res) => {
  const { consumidor_id, usina_id, percentual, status_id, data_inicio } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .insert([
        { consumidor_id, usina_id, percentual, status_id, data_inicio }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- ATUALIZAR VÍNCULO ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { percentual, status_id, data_inicio, data_fim } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .update({ 
        percentual, 
        status_id, 
        data_inicio, 
        data_fim, 
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- EXCLUIR VÍNCULO ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Vínculo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
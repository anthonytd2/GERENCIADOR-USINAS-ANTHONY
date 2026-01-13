import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- LISTAR TODOS OS VÍNCULOS (MÉTODO SEGURO - MANUAL JOIN) ---
router.get('/', async (req, res) => {
  try {
    // 1. Busca APENAS os vínculos (sem tentar fazer join automático que dá erro)
    const { data: vinculos, error: errorVinculos } = await supabase
      .from('vinculos')
      .select('*')
      .order('created_at', { ascending: false });

    if (errorVinculos) throw errorVinculos;

    // 2. Busca as tabelas auxiliares separadamente
    // Isso evita o erro de "Could not find relationship"
    const { data: consumidores } = await supabase.from('consumidores').select('ConsumidorID, Nome');
    const { data: usinas } = await supabase.from('usinas').select('UsinaID, Nome, NomeProprietario');
    const { data: statusList } = await supabase.from('status').select('StatusID, Descricao');

    // 3. Cruza os dados manualmente usando JavaScript
    const vinculosFormatados = vinculos.map(v => {
      // Encontra o consumidor correspondente pelo ID
      const cons = consumidores?.find(c => c.ConsumidorID === v.ConsumidorID);
      // Encontra a usina correspondente pelo ID
      const usina = usinas?.find(u => u.UsinaID === v.UsinaID);
      // Encontra o status correspondente pelo ID
      const stat = statusList?.find(s => s.StatusID === v.StatusID);

      // Define o nome do status (usa o do banco ou um fallback fixo)
      let nomeStatus = stat?.Descricao;
      if (!nomeStatus) {
         if (v.StatusID === 1) nomeStatus = 'Ativo';
         else if (v.StatusID === 2) nomeStatus = 'Pendente';
         else nomeStatus = 'Verificar';
      }

      return {
        id: v.VinculoID, // O frontend espera 'id' minúsculo
        consumidor_id: v.ConsumidorID,
        usina_id: v.UsinaID,
        status_id: v.StatusID,
        percentual: v.Percentual,
        data_inicio: v.DataInicio,
        
        // Campos montados manualmente
        consumidor_nome: cons?.Nome || 'Consumidor não encontrado',
        usina_nome: usina?.NomeProprietario || usina?.Nome || 'Usina não encontrada',
        status_nome: nomeStatus
      };
    });

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro detalhado ao buscar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar dados: ' + error.message });
  }
});

// --- CRIAR NOVO VÍNCULO ---
router.post('/', async (req, res) => {
  const { ConsumidorID, UsinaID, Percentual, StatusID, Observacao } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .insert([{ 
          ConsumidorID, 
          UsinaID, 
          Percentual, 
          StatusID, 
          Observacao,
          DataInicio: new Date()
      }])
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
  const { Percentual, StatusID, Observacao } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .update({ 
        Percentual, 
        StatusID, 
        Observacao,
        updated_at: new Date() 
      })
      .eq('VinculoID', id)
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
      .eq('VinculoID', id);

    if (error) throw error;
    res.json({ message: 'Vínculo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
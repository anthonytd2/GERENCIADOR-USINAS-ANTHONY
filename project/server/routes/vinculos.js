import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- LISTAR VÍNCULOS ---
router.get('/', async (req, res) => {
  try {
    // 1. Busca os vínculos ordenando pelo ID (VinculoID) que é garantido existir
    const { data: vinculos, error: errorVinculos } = await supabase
      .from('vinculos')
      .select('*')
      .order('VinculoID', { ascending: false }); // Mudado de 'created_at' para 'VinculoID'

    if (errorVinculos) throw errorVinculos;

    // 2. Busca dados auxiliares
    const { data: consumidores } = await supabase.from('consumidores').select('*');
    const { data: usinas } = await supabase.from('usinas').select('*');
    const { data: statusList } = await supabase.from('status').select('*');

    // 3. Monta o resultado final
    const vinculosFormatados = vinculos.map(v => {
      // Tenta casar os IDs ignorando maiúsculas/minúsculas nas chaves
      const cons = consumidores?.find(c => (c.ConsumidorID || c.consumidorid) === (v.ConsumidorID || v.consumidorid));
      const usina = usinas?.find(u => (u.UsinaID || u.usinaid) === (v.UsinaID || v.usinaid));
      const stat = statusList?.find(s => (s.StatusID || s.statusid) === (v.StatusID || v.statusid));

      // Determina o nome do status
      let nomeStatus = stat?.Descricao || stat?.descricao;
      if (!nomeStatus) {
         const sID = v.StatusID || v.statusid;
         if (sID === 1) nomeStatus = 'Ativo';
         else if (sID === 2) nomeStatus = 'Pendente';
         else nomeStatus = 'Verificar';
      }

      return {
        id: v.VinculoID || v.vinculoid,
        consumidor_id: v.ConsumidorID || v.consumidorid,
        usina_id: v.UsinaID || v.usinaid,
        status_id: v.StatusID || v.statusid,
        percentual: v.Percentual || v.percentual,
        data_inicio: v.DataInicio || v.datainicio,
        observacao: v.Observacao || v.observacao,
        
        // Nomes para exibição
        consumidor_nome: cons?.Nome || cons?.nome || 'Consumidor não encontrado',
        usina_nome: usina?.NomeProprietario || usina?.nomeproprietario || 'Usina não encontrada',
        status_nome: nomeStatus
      };
    });

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: 'Erro ao buscar dados: ' + error.message });
  }
});

// --- CRIAR ---
router.post('/', async (req, res) => {
  try {
    // Pega os dados enviados pelo frontend
    const { ConsumidorID, UsinaID, Percentual, StatusID, Observacao } = req.body;
    
    // Monta o objeto para inserir
    const novoVinculo = {
      ConsumidorID,
      UsinaID,
      StatusID,
      Percentual,
      Observacao,
      DataInicio: new Date()
    };

    const { data, error } = await supabase
      .from('vinculos')
      .insert([novoVinculo])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- EXCLUIR ---
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('VinculoID', req.params.id); // Tenta VinculoID (Maiúsculo)

    if (error) {
        // Se falhar, tenta minúsculo por garantia
        await supabase.from('vinculos').delete().eq('vinculoid', req.params.id);
    }

    res.json({ message: 'Sucesso' });
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
      .update({ 
        Percentual, 
        StatusID, 
        Observacao,
        updated_at: new Date() 
      })
      .eq('VinculoID', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
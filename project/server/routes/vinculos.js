import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- LISTAR TODOS OS VÍNCULOS ---
router.get('/', async (req, res) => {
  try {
    const { data: vinculos, error: errorVinculos } = await supabase
      .from('vinculos')
      .select('*')
      .order('VinculoID', { ascending: false });

    if (errorVinculos) throw errorVinculos;

    // Busca dados auxiliares para montar a lista
    const { data: consumidores } = await supabase.from('consumidores').select('*');
    const { data: usinas } = await supabase.from('usinas').select('*');
    const { data: statusList } = await supabase.from('status').select('*');

    const vinculosFormatados = vinculos.map(v => {
      const cons = consumidores?.find(c => (c.ConsumidorID || c.consumidorid) === (v.ConsumidorID || v.consumidorid));
      const usina = usinas?.find(u => (u.UsinaID || u.usinaid) === (v.UsinaID || v.usinaid));
      const stat = statusList?.find(s => (s.StatusID || s.statusid) === (v.StatusID || v.statusid));

      let nomeStatus = stat?.Descricao || stat?.descricao;
      if (!nomeStatus) {
         if ((v.StatusID || v.statusid) === 1) nomeStatus = 'Ativo';
         else if ((v.StatusID || v.statusid) === 2) nomeStatus = 'Pendente';
         else nomeStatus = 'Verificar';
      }

      return {
        id: v.VinculoID || v.vinculoid,
        consumidor_id: v.ConsumidorID || v.consumidorid,
        usina_id: v.UsinaID || v.usinaid,
        status_id: v.StatusID || v.statusid,
        percentual: v.Percentual || v.percentual,
        data_inicio: v.DataInicio || v.datainicio,
        consumidor_nome: cons?.Nome || cons?.nome || 'Consumidor não encontrado',
        usina_nome: usina?.NomeProprietario || usina?.nomeproprietario || 'Usina não encontrada',
        status_nome: nomeStatus
      };
    });

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro backend:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- NOVO: BUSCAR UM VÍNCULO ESPECÍFICO (DETALHES) ---
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1. Busca o vínculo específico
    const { data: vinculo, error } = await supabase
      .from('vinculos')
      .select('*')
      .eq('VinculoID', id) // Tenta Maiúsculo
      .single();

    // Se falhar, tenta minúsculo
    let dadosVinculo = vinculo;
    if (error || !vinculo) {
       const retry = await supabase.from('vinculos').select('*').eq('vinculoid', id).single();
       dadosVinculo = retry.data;
    }

    if (!dadosVinculo) return res.status(404).json({ error: 'Vínculo não encontrado' });

    // 2. Busca os detalhes relacionados (Consumidor, Usina, Status)
    const { data: consumidor } = await supabase.from('consumidores').select('*').eq('ConsumidorID', dadosVinculo.ConsumidorID || dadosVinculo.consumidorid).single();
    const { data: usina } = await supabase.from('usinas').select('*').eq('UsinaID', dadosVinculo.UsinaID || dadosVinculo.usinaid).single();
    const { data: status } = await supabase.from('status').select('*').eq('StatusID', dadosVinculo.StatusID || dadosVinculo.statusid).single();

    // 3. Monta o objeto completo para a tela de detalhes
    const resultado = {
      ...dadosVinculo,
      // Normaliza os IDs e nomes para o frontend
      id: dadosVinculo.VinculoID || dadosVinculo.vinculoid,
      ConsumidorID: dadosVinculo.ConsumidorID || dadosVinculo.consumidorid,
      UsinaID: dadosVinculo.UsinaID || dadosVinculo.usinaid,
      StatusID: dadosVinculo.StatusID || dadosVinculo.statusid,
      Percentual: dadosVinculo.Percentual || dadosVinculo.percentual,
      Observacao: dadosVinculo.Observacao || dadosVinculo.observacao,
      
      // Inclui os objetos completos para exibir nomes e detalhes
      consumidor: consumidor || {},
      usina: usina || {},
      status: status || {}
    };

    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar detalhe:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- CRIAR ---
router.post('/', async (req, res) => {
  try {
    const { ConsumidorID, UsinaID, Percentual, StatusID, Observacao } = req.body;
    
    const { data, error } = await supabase
      .from('vinculos')
      .insert([{ 
          ConsumidorID, UsinaID, Percentual, StatusID, Observacao,
          DataInicio: new Date()
      }])
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
      .update({ Percentual, StatusID, Observacao, updated_at: new Date() })
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
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('VinculoID', req.params.id);

    if (error) await supabase.from('vinculos').delete().eq('vinculoid', req.params.id);
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
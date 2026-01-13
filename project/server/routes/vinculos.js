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

    // Busca dados auxiliares
    const { data: consumidores } = await supabase.from('consumidores').select('*');
    const { data: usinas } = await supabase.from('usinas').select('*');
    const { data: statusList } = await supabase.from('status').select('*');

    const vinculosFormatados = vinculos.map(v => {
      // Cruzamento manual de dados para evitar erros de Foreign Key
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

// --- ROTA DE DETALHES (ESSENCIAL PARA O CLIQUE FUNCIONAR) ---
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Busca o vínculo
    let { data: vinculo, error } = await supabase
      .from('vinculos')
      .select('*')
      .eq('VinculoID', id)
      .single();

    // Tenta minúsculo se falhar (fallback de segurança)
    if (error || !vinculo) {
       const retry = await supabase.from('vinculos').select('*').eq('vinculoid', id).single();
       vinculo = retry.data;
    }

    if (!vinculo) return res.status(404).json({ error: 'Vínculo não encontrado' });

    // Busca dados complementares para mostrar na tela de detalhes
    const { data: consumidor } = await supabase.from('consumidores').select('*').eq('ConsumidorID', vinculo.ConsumidorID || vinculo.consumidorid).single();
    const { data: usina } = await supabase.from('usinas').select('*').eq('UsinaID', vinculo.UsinaID || vinculo.usinaid).single();
    const { data: status } = await supabase.from('status').select('*').eq('StatusID', vinculo.StatusID || vinculo.statusid).single();

    const resultado = {
      ...vinculo,
      id: vinculo.VinculoID || vinculo.vinculoid,
      consumidor: consumidor || {},
      usina: usina || {},
      status: status || {}
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
    const { error } = await supabase.from('vinculos').delete().eq('VinculoID', req.params.id);
    if (error) await supabase.from('vinculos').delete().eq('vinculoid', req.params.id);
    res.json({ message: 'Sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
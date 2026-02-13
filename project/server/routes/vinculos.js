import express from 'express';
import { supabase } from '../db.js';
import { z } from 'zod';

const router = express.Router();

const vinculoSchema = z.object({
  usina_id: z.number().int().positive(),
  consumidor_id: z.number().int().positive(),
  percentual: z.number().min(0).max(100),
  data_inicio: z.string().min(1),
  status_id: z.number().int().positive(),
  data_fim: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable()
});

// ==========================================
// ROTAS PRINCIPAIS (CRUD VÍNCULOS)
// ==========================================

// 1. LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (id, nome, tipo),
        consumidores (consumidor_id, nome, cidade, uf),
        status (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro listar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculos' });
  }
});

// 2. BUSCAR UM (DETALHES)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        status:status_id (*),
        consumidores:consumidor_id (
            consumidor_id, nome, documento, endereco, bairro, cidade, uf, cep, percentual_desconto
        ),
        usinas:usina_id (id, nome, tipo, potencia, endereco_proprietario),
        unidades_vinculadas (
          id, 
          percentual_rateio,  
          unidade_consumidora_id,
          unidades_consumidoras (
            id, codigo_uc, endereco, bairro, cidade
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vínculo não encontrado' });

    const vinculoMapeado = {
        ...data,
        consumidores: {
            ...data.consumidores,
            id: data.consumidores?.consumidor_id,
            cpf_cnpj: data.consumidores?.documento
        }
    };

    res.json(vinculoMapeado);

  } catch (error) {
    console.error('Erro detalhe vínculo:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

// 3. CRIAR VÍNCULO
router.post('/', async (req, res) => {
  try {
    let dataInicio = req.body.data_inicio;
    if (!dataInicio) dataInicio = new Date().toISOString().split('T')[0];

    const payload = {
      usina_id: Number(req.body.usina_id),
      consumidor_id: Number(req.body.consumidor_id),
      percentual: Number(req.body.percentual),
      status_id: Number(req.body.status_id) || 1,
      data_inicio: dataInicio,
      data_fim: req.body.data_fim || null,
      observacao: req.body.observacao || req.body.observacoes
    };

    const { data: usinaOcupada } = await supabase
      .from('vinculos')
      .select('id')
      .eq('usina_id', payload.usina_id)
      .neq('status_id', 2)
      .maybeSingle();

    if (usinaOcupada) return res.status(400).json({ error: 'Usina já possui contrato ativo.' });

    const { data: consumidorOcupado } = await supabase
      .from('vinculos')
      .select('id')
      .eq('consumidor_id', payload.consumidor_id)
      .neq('status_id', 2)
      .maybeSingle();

    if (consumidorOcupado) return res.status(400).json({ error: 'Consumidor já possui contrato ativo.' });

    const { data: novoVinculo, error } = await supabase
      .from('vinculos')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    const unidadesSelecionadas = req.body.unidades_selecionadas || [];
    if (unidadesSelecionadas.length > 0 && novoVinculo) {
      const ucsParaInserir = unidadesSelecionadas.map(ucId => ({
        vinculo_id: novoVinculo.id,
        unidade_consumidora_id: ucId,
        percentual_rateio: 0
      }));
      await supabase.from('unidades_vinculadas').insert(ucsParaInserir);
    }

    res.status(201).json(novoVinculo);
  } catch (error) {
    console.error('Erro criar vínculo:', error);
    res.status(500).json({ error: 'Erro interno ao criar vínculo.' });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // CORREÇÃO: Adicionado 'data_fim' nos campos permitidos para atualização
    const dados = {
      status_id: req.body.status_id,
      observacao: req.body.observacao,
      data_fim: req.body.data_fim || null // Agora permite atualizar ou limpar a data
    };

    const { data, error } = await supabase
      .from('vinculos')
      .update(dados)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: 'Erro ao atualizar vínculo' });
  }
});

// 5. ENCERRAR
router.put('/:id/encerrar', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_fim } = req.body;

    const { data, error } = await supabase
      .from('vinculos')
      .update({ data_fim, status_id: 2 })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao encerrar vínculo' });
  }
});

// 6. DELETAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await supabase.from('unidades_vinculadas').delete().eq('vinculo_id', id);
    await supabase.from('auditorias_vinculos').delete().eq('vinculo_id', id);

    const { error } = await supabase.from('vinculos').delete().eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir vínculo' });
  }
});

// ==========================================
// ROTAS DE AUDITORIA (CORRIGIDAS)
// ==========================================

// 1. LISTAR AUDITORIAS DO VÍNCULO
router.get('/:id/auditorias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('auditorias_vinculos')
      .select(`
        *,
        faturas:auditorias_faturas (
          id,
          unidade_id,
          percentual_aplicado,
          saldo_anterior,
          creditos_injetados,
          creditos_consumidos,
          saldo_final,
          data_leitura,
          unidades_consumidoras (codigo_uc, endereco)
        )
      `)
      .eq('vinculo_id', req.params.id)
      .order('mes_referencia', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. CRIAR NOVA AUDITORIA
router.post('/:id/auditorias', async (req, res) => {
  try {
    const vinculo_id = req.params.id;
    const { faturas, ...dadosCabecalho } = req.body;

    // --- CORREÇÃO: Calcula os totais antes de salvar o cabeçalho ---
    let totalInjetado = 0;
    let totalConsumido = 0;
    let saldoFinalTotal = 0;

    if (faturas && Array.isArray(faturas)) {
        totalInjetado = faturas.reduce((acc, f) => acc + (Number(f.creditos_injetados) || 0), 0);
        totalConsumido = faturas.reduce((acc, f) => acc + (Number(f.creditos_consumidos) || 0), 0);
        saldoFinalTotal = faturas.reduce((acc, f) => acc + (Number(f.saldo_final) || 0), 0);
    }

    // Prepara o objeto com os totais calculados
    const dadosParaSalvar = {
        ...dadosCabecalho,
        vinculo_id,
        creditos_injetados: totalInjetado,
        creditos_consumidos: totalConsumido,
        saldo_final: saldoFinalTotal
    };
    // -------------------------------------------------------------

    // A. Salva o Cabeçalho
    const { data: auditoria, error: errAuditoria } = await supabase
      .from('auditorias_vinculos')
      .insert([dadosParaSalvar])
      .select()
      .single();

    if (errAuditoria) throw errAuditoria;

    // B. Salva as Faturas Individuais
    if (faturas && faturas.length > 0) {
      const itensParaSalvar = faturas.map(item => ({
        auditoria_id: auditoria.id,
        unidade_id: item.unidade_id,
        percentual_aplicado: item.percentual_aplicado,
        saldo_anterior: item.saldo_anterior || 0,
        creditos_injetados: item.creditos_injetados || 0,
        creditos_consumidos: item.creditos_consumidos || 0,
        saldo_final: item.saldo_final || 0,
        data_leitura: item.data_leitura || (dadosCabecalho.mes_referencia + '-01')
      }));

      const { error: errFaturas } = await supabase
        .from('auditorias_faturas')
        .insert(itensParaSalvar);

      if (errFaturas) console.error('Erro ao salvar faturas:', errFaturas);
    }

    res.status(201).json(auditoria);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Já existe uma auditoria para este mês neste vínculo.' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 3. ATUALIZAR AUDITORIA
router.put('/auditorias/:auditoriaId', async (req, res) => {
  try {
    const { faturas, ...dadosCabecalho } = req.body;

    // --- CORREÇÃO: Calcula os totais antes de atualizar o cabeçalho ---
    let totalInjetado = 0;
    let totalConsumido = 0;
    let saldoFinalTotal = 0;

    if (faturas && Array.isArray(faturas)) {
        totalInjetado = faturas.reduce((acc, f) => acc + (Number(f.creditos_injetados) || 0), 0);
        totalConsumido = faturas.reduce((acc, f) => acc + (Number(f.creditos_consumidos) || 0), 0);
        saldoFinalTotal = faturas.reduce((acc, f) => acc + (Number(f.saldo_final) || 0), 0);
    }

    const dadosParaAtualizar = {
        ...dadosCabecalho,
        creditos_injetados: totalInjetado,
        creditos_consumidos: totalConsumido,
        saldo_final: saldoFinalTotal
    };
    // -----------------------------------------------------------------

    // A. Atualiza o Pai
    const { error: errPai } = await supabase
      .from('auditorias_vinculos')
      .update(dadosParaAtualizar)
      .eq('id', req.params.auditoriaId);

    if (errPai) throw errPai;

    // B. Atualiza os Filhos (Estratégia: Deleta antigos e recria novos)
    if (faturas) {
      await supabase.from('auditorias_faturas').delete().eq('auditoria_id', req.params.auditoriaId);

      const itensParaSalvar = faturas.map(item => ({
        auditoria_id: req.params.auditoriaId,
        unidade_id: item.unidade_id,
        percentual_aplicado: item.percentual_aplicado,
        saldo_anterior: item.saldo_anterior || 0,
        creditos_injetados: item.creditos_injetados || 0,
        creditos_consumidos: item.creditos_consumidos || 0,
        saldo_final: item.saldo_final || 0,
        data_leitura: item.data_leitura
      }));

      await supabase.from('auditorias_faturas').insert(itensParaSalvar);
    }

    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETAR AUDITORIA
router.delete('/auditorias/:auditoriaId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('auditorias_vinculos')
      .delete()
      .eq('id', req.params.auditoriaId);

    if (error) throw error;
    res.json({ message: 'Excluído' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE RATEIO
// ==========================================

router.post('/:id/unidades', async (req, res) => {
    try {
        const vinculo_id = req.params.id;
        const { unidade_consumidora_id, percentual_rateio } = req.body;
        const { data, error } = await supabase
            .from('unidades_vinculadas')
            .insert([{ vinculo_id, unidade_consumidora_id, percentual_rateio }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/unidades_vinculadas/:linkId', async (req, res) => {
    try {
        const { percentual_rateio } = req.body;
        const { error } = await supabase
            .from('unidades_vinculadas')
            .update({ percentual_rateio })
            .eq('id', req.params.linkId);
        if (error) throw error;
        res.json({ message: 'Rateio atualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/unidades_vinculadas/:linkId', async (req, res) => {
    try {
        const { error } = await supabase.from('unidades_vinculadas').delete().eq('id', req.params.linkId);
        if (error) throw error;
        res.json({ message: 'Removido' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
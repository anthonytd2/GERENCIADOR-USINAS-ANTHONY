import express from 'express';
import { supabase } from '../db.js';
import { z } from 'zod';
import xss from 'xss'; 

const router = express.Router();

// 🟢 Função de Segurança (Varredor de XSS)
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

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
      .is('deleted_at', null)
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
            consumidor_id, nome, documento, endereco, bairro, cidade, uf, cep, percentual_desconto, media_consumo
        ),
        usinas:usina_id (id, nome, tipo, potencia, endereco_proprietario, valor_kw_bruto),
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
      .is('deleted_at', null)
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
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

// 3. CRIAR VÍNCULO (🟢 ATUALIZADO: MULTI-USINA POR CONSUMIDOR)
router.post('/', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);

    let dataInicio = body.data_inicio;
    if (!dataInicio) dataInicio = new Date().toISOString().split('T')[0];

    const payload = {
      usina_id: Number(body.usina_id),
      consumidor_id: Number(body.consumidor_id),
      percentual: Number(body.percentual),
      status_id: Number(body.status_id) || 1,
      data_inicio: dataInicio,
      data_fim: body.data_fim || null,
      observacao: body.observacao || body.observacoes
    };

    // 🟢 VERIFICAÇÃO: Usina já locada? (A Usina é exclusiva)
    const { data: usinaOcupada, error: errUsina } = await req.supabase
      .from('vinculos')
      .select('id')
      .eq('usina_id', payload.usina_id)
      .neq('status_id', 2)
      .is('deleted_at', null);

    if (errUsina) throw errUsina;
    if (usinaOcupada && usinaOcupada.length > 0) {
      return res.status(400).json({ error: 'Atenção: Esta Usina já possui um contrato ativo no sistema.' });
    }

    // ❌ TRAVA DO CONSUMIDOR REMOVIDA DAQUI PARA PERMITIR MÚLTIPLAS USINAS NO MESMO CLIENTE

    // 🟢 INSERÇÃO DO VÍNCULO
    const { data: novoVinculo, error: errInsert } = await req.supabase
      .from('vinculos')
      .insert([payload])
      .select()
      .single();

    if (errInsert) throw errInsert;

    // Vincula unidades se houver
    const unidadesSelecionadas = body.unidades_selecionadas || [];
    if (unidadesSelecionadas.length > 0 && novoVinculo) {
      const ucsParaInserir = unidadesSelecionadas.map(ucId => ({
        vinculo_id: novoVinculo.id,
        unidade_consumidora_id: ucId,
        percentual_rateio: 0
      }));
      await req.supabase.from('unidades_vinculadas').insert(ucsParaInserir);
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
    const body = sanitizeInput(req.body);
    const dados = {
      status_id: body.status_id,
      observacao: body.observacao,
      data_fim: body.data_fim || null 
    };

    const { data, error } = await req.supabase
      .from('vinculos')
      .update(dados)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar vínculo' });
  }
});

// 5. ENCERRAR
router.put('/:id/encerrar', async (req, res) => {
  try {
    const { id } = req.params;
    const body = sanitizeInput(req.body);
    const { data_fim } = body;
    const { data, error } = await req.supabase
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

// 6. DELETAR / SOFT DELETE
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from('vinculos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir vínculo' });
  }
});

// ==========================================
// ROTAS DE AUDITORIA 
// ==========================================

router.get('/:id/auditorias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('auditorias_vinculos')
      .select(`
        *,
        faturas:auditorias_faturas (
          id, unidade_id, percentual_aplicado, saldo_anterior, creditos_injetados, creditos_consumidos, saldo_final, data_leitura,
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

router.post('/:id/auditorias', async (req, res) => {
  try {
    const vinculo_id = req.params.id;
    const body = sanitizeInput(req.body);
    const { faturas, ...dadosCabecalho } = body;

    let totalInjetado = faturas?.reduce((acc, f) => acc + (Number(f.creditos_injetados) || 0), 0) || 0;
    let totalConsumido = faturas?.reduce((acc, f) => acc + (Number(f.creditos_consumidos) || 0), 0) || 0;
    let saldoFinalTotal = faturas?.reduce((acc, f) => acc + (Number(f.saldo_final) || 0), 0) || 0;

    const dadosParaSalvar = {
        ...dadosCabecalho,
        vinculo_id,
        creditos_injetados: totalInjetado,
        creditos_consumidos: totalConsumido,
        saldo_final: saldoFinalTotal
    };

    const { data: auditoria, error: errAuditoria } = await req.supabase
      .from('auditorias_vinculos')
      .insert([dadosParaSalvar])
      .select().single();

    if (errAuditoria) throw errAuditoria;

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
      await req.supabase.from('auditorias_faturas').insert(itensParaSalvar);
    }

    res.status(201).json(auditoria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR AUDITORIA
router.put('/auditorias/:auditoriaId', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const { faturas, ...dadosCabecalho } = body;

    let totalInjetado = faturas?.reduce((acc, f) => acc + (Number(f.creditos_injetados) || 0), 0) || 0;
    let totalConsumido = faturas?.reduce((acc, f) => acc + (Number(f.creditos_consumidos) || 0), 0) || 0;
    let saldoFinalTotal = faturas?.reduce((acc, f) => acc + (Number(f.saldo_final) || 0), 0) || 0;

    const dadosParaAtualizar = {
        ...dadosCabecalho,
        creditos_injetados: totalInjetado,
        creditos_consumidos: totalConsumido,
        saldo_final: saldoFinalTotal
    };

    const { error: errPai } = await req.supabase
      .from('auditorias_vinculos')
      .update(dadosParaAtualizar)
      .eq('id', req.params.auditoriaId);

    if (errPai) throw errPai;

    if (faturas) {
      await req.supabase.from('auditorias_faturas').delete().eq('auditoria_id', req.params.auditoriaId);

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

      await req.supabase.from('auditorias_faturas').insert(itensParaSalvar);
    }

    res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETAR AUDITORIA
router.delete('/auditorias/:auditoriaId', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('auditorias_vinculos')
      .delete()
      .eq('id', req.params.auditoriaId);

    if (error) throw error;
    res.json({ message: 'Excluído' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ROTAS DE RATEIO
router.post('/:id/unidades', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const { data, error } = await req.supabase
      .from('unidades_vinculadas')
      .insert([{ vinculo_id: req.params.id, ...body }])
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/unidades_vinculadas/:linkId', async (req, res) => {
  try {
    const body = sanitizeInput(req.body);
    const { error } = await req.supabase
      .from('unidades_vinculadas')
      .update({ percentual_rateio: body.percentual_rateio })
      .eq('id', req.params.linkId);
    if (error) throw error;
    res.json({ message: 'Rateio atualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/unidades_vinculadas/:linkId', async (req, res) => {
  try {
    const { error } = await req.supabase.from('unidades_vinculadas').delete().eq('id', req.params.linkId);
    if (error) throw error;
    res.json({ message: 'Removido' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
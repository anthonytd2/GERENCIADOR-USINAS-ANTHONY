import express from 'express';
import { supabase } from '../db.js';
import { z } from 'zod';

const router = express.Router();

// Schema de Validação
const vinculoSchema = z.object({
  usina_id: z.number().int().positive('Selecione uma usina válida'),
  consumidor_id: z.number().int().positive('Selecione um consumidor válido'),
  percentual: z.number().min(0).max(100, 'Percentual deve ser entre 0 e 100'),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  status_id: z.number().int().positive('Status inválido'),
  data_fim: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable()
});

// 1. LISTAR TODOS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (usina_id, nome_proprietario, tipo),
        consumidores (consumidor_id, nome, cidade, uf),
        status (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculos' });
  }
});

// 2. BUSCAR UM (COM LÓGICA INTELIGENTE DE UCs)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // A. Busca o Vínculo e as Unidades Vinculadas (Rateio Configurado)
    const { data: vinculo, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        status:status_id (*),
        consumidores:consumidor_id (
            consumidor_id, nome, documento, endereco, bairro, cidade, uf, cep, percentual_desconto
        ),
        usinas:usina_id (usina_id, nome_proprietario, tipo, potencia, cpf_cnpj, endereco_proprietario),
        unidades_vinculadas (
          id, 
          percentual_rateio,  
          unidade_consumidora_id,
          unidades_consumidoras (
            id, codigo_uc, endereco, bairro, cidade
          )
        )
      `)
      .eq('vinculo_id', id)
      .single();

    if (error) throw error;
    if (!vinculo) return res.status(404).json({ error: 'Vínculo não encontrado' });

    // --- B. O PULO DO GATO (FALLBACK INTELIGENTE) ---
    // Se a lista 'unidades_vinculadas' estiver vazia (usuário não configurou rateio),
    // buscamos automaticamente TODAS as UCs ativas desse consumidor.
    if (!vinculo.unidades_vinculadas || vinculo.unidades_vinculadas.length === 0) {
      const { data: todasUcs } = await supabase
        .from('unidades_consumidoras')
        .select('id, codigo_uc, endereco, bairro, cidade')
        .eq('consumidor_id', vinculo.consumidor_id)
        .eq('ativo', true);

      if (todasUcs && todasUcs.length > 0) {
        // Transformamos as UCs soltas no formato que o Frontend espera (simulando um rateio)
        vinculo.unidades_vinculadas = todasUcs.map(uc => ({
          id: 0, // ID fake (indica que não está salvo no rateio ainda)
          percentual_rateio: 0,
          unidade_consumidora_id: uc.id, // <--- AQUI ESTÁ O ID QUE FALTAVA (O ERRO ERA AQUI)
          unidades_consumidoras: uc
        }));
      }
    }
    // ------------------------------------------------

    res.json(vinculo);

  } catch (error) {
    console.error('Erro ao buscar detalhe do vínculo:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

// 3. CRIAR VÍNCULO
router.post('/', async (req, res) => {
  try {
    console.log('Recebendo dados brutos:', req.body);

    let dataInicio = req.body.data_inicio;
    if (!dataInicio || dataInicio.trim() === '') {
      dataInicio = new Date().toISOString().split('T')[0];
    }

    let statusId = Number(req.body.status_id);
    if (!statusId || isNaN(statusId)) {
      statusId = 1;
    }

    const payload = {
      usina_id: Number(req.body.usina_id),
      consumidor_id: Number(req.body.consumidor_id),
      percentual: Number(req.body.percentual),
      status_id: statusId,
      data_inicio: dataInicio,
      data_fim: req.body.data_fim || null,
      observacoes: req.body.observacoes || null
    };

    const dadosValidados = vinculoSchema.parse(payload);

    // --- TRAVA DE EXCLUSIVIDADE ---
    const { data: usinaOcupada, error: erroUsina } = await supabase
      .from('vinculos')
      .select('vinculo_id')
      .eq('usina_id', dadosValidados.usina_id)
      .neq('status_id', 2)
      .maybeSingle();

    if (erroUsina) throw erroUsina;

    if (usinaOcupada) {
      return res.status(400).json({
        error: 'Operação Bloqueada',
        detalhes: ['Esta Usina já possui um contrato ativo.']
      });
    }

    const { data: consumidorOcupado, error: erroCheckConsumidor } = await supabase
      .from('vinculos')
      .select('vinculo_id')
      .eq('consumidor_id', dadosValidados.consumidor_id)
      .neq('status_id', 2)
      .maybeSingle();

    if (erroCheckConsumidor) throw erroCheckConsumidor;

    if (consumidorOcupado) {
      return res.status(400).json({
        error: 'Operação Bloqueada',
        detalhes: ['Este Consumidor já possui um contrato ativo.']
      });
    }

    // VALIDAÇÃO DE CAPACIDADE
    const { data: vinculosExistentes, error: erroBusca } = await supabase
      .from('vinculos')
      .select('percentual, status_id')
      .eq('usina_id', dadosValidados.usina_id);

    if (erroBusca) throw erroBusca;

    const vinculosAtivos = vinculosExistentes.filter(v => v.status_id !== 2);
    const totalUsado = vinculosAtivos.reduce((acc, v) => acc + Number(v.percentual), 0);
    const disponivel = 100 - totalUsado;

    if (Number(dadosValidados.percentual) > disponivel) {
      return res.status(400).json({
        error: 'Capacidade excedida',
        detalhes: [`Disponível: ${disponivel}%. Tentou alocar: ${dadosValidados.percentual}%.`]
      });
    }

    // INSERIR VÍNCULO
    const { data: novoVinculo, error } = await supabase
      .from('vinculos')
      .insert([dadosValidados])
      .select()
      .single();

    if (error) throw error;

    // Se houver unidades selecionadas no cadastro inicial, insere na tabela nova
    const unidadesSelecionadas = req.body.unidades_selecionadas || [];
    if (unidadesSelecionadas.length > 0 && novoVinculo.vinculo_id) {
      const ucsParaInserir = unidadesSelecionadas.map(ucId => ({
        vinculo_id: novoVinculo.vinculo_id,
        unidade_consumidora_id: ucId,
        percentual_rateio: 0
      }));

      const { error: erroUcs } = await supabase
        .from('unidades_vinculadas')
        .insert(ucsParaInserir);

      if (erroUcs) console.error('Erro ao salvar UCs:', erroUcs);
    }

    res.status(201).json(novoVinculo);

  } catch (error) {
    console.error('Erro ao criar vínculo:', error);
    if (error instanceof z.ZodError) {
      const mensagens = error.errors ? error.errors.map(e => e.message) : ['Dados inválidos'];
      return res.status(400).json({ error: 'Dados inválidos', detalhes: mensagens });
    }
    res.status(500).json({ error: 'Erro interno ao criar vínculo.' });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dados = {
      ...req.body,
      data_fim: req.body.data_fim || null
    };

    const { data, error } = await supabase
      .from('vinculos')
      .update(dados)
      .eq('vinculo_id', id)
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
    const { data_fim } = req.body;
    const statusEncerrado = 2;

    const { data, error } = await supabase
      .from('vinculos')
      .update({
        data_fim: data_fim,
        status_id: statusEncerrado
      })
      .eq('vinculo_id', id)
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
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('vinculo_id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir vínculo' });
  }
});

// ==========================================
// GESTÃO DE UNIDADES DO VÍNCULO (RATEIO)
// ==========================================

router.post('/:id/unidades', async (req, res) => {
  try {
    const vinculo_id = req.params.id;
    const { unidade_consumidora_id, percentual_rateio } = req.body;

    const { data, error } = await supabase
      .from('unidades_vinculadas')
      .insert([{
        vinculo_id,
        unidade_consumidora_id,
        percentual_rateio
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/unidades_vinculadas/:linkId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('unidades_vinculadas')
      .delete()
      .eq('id', req.params.linkId);

    if (error) throw error;
    res.json({ message: 'Unidade removida do rateio' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AUDITORIAS DINÂMICAS (PAI E FILHOS)
// ==========================================

// 1. LISTAR (Traz o Pai e os Filhos/Faturas)
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

// 2. CRIAR (Salva Pai e Filhos)
router.post('/:id/auditorias', async (req, res) => {
  try {
    const vinculo_id = req.params.id;
    const { faturas, ...dadosCabecalho } = req.body; // Separa as faturas do resto

    // A. Salva o Cabeçalho
    const { data: auditoria, error: errAuditoria } = await supabase
      .from('auditorias_vinculos')
      .insert([{ ...dadosCabecalho, vinculo_id }])
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

// 3. ATUALIZAR (Edita Pai e Refaz Filhos)
router.put('/auditorias/:auditoriaId', async (req, res) => {
  try {
    const { faturas, ...dadosCabecalho } = req.body;

    // A. Atualiza o Pai
    const { error: errPai } = await supabase
      .from('auditorias_vinculos')
      .update(dadosCabecalho)
      .eq('id', req.params.auditoriaId);

    if (errPai) throw errPai;

    // B. Atualiza os Filhos (Deleta antigos e recria novos)
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

// 4. DELETAR
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

export default router;
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
  observacoes: z.string().optional().nullable() // <--- ADICIONE ESTA LINHA
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

// 2. BUSCAR UM (COM AS UCs VINCULADAS E DADOS COMPLETOS DO CONSUMIDOR)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // A. Busca o vínculo principal com TODOS os dados do consumidor e da usina
    const { data: vinculo, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (usina_id, nome_proprietario, tipo, potencia, cpf_cnpj, endereco_proprietario),
        consumidores (
            consumidor_id, 
            nome, 
            documento, 
            endereco, 
            bairro, 
            cidade, 
            uf, 
            cep
        ),
        status (*)
      `)
      .eq('vinculo_id', id)
      .single();

    if (error) throw error;
    if (!vinculo) return res.status(404).json({ error: 'Vínculo não encontrado' });

    // B. Busca as UCs vinculadas (Mantido)
    const { data: ucsVinculadas, error: erroUcs } = await supabase
      .from('vinculos_unidades')
      .select(`
        id,
        unidade_consumidora_id,
        unidades_consumidoras (codigo_uc, endereco, bairro)
      `)
      .eq('vinculo_id', id);

    if (erroUcs) throw erroUcs;

    // C. Junta tudo na resposta
    res.json({ ...vinculo, unidades_vinculadas: ucsVinculadas });

  } catch (error) {
    console.error('Erro ao buscar detalhe do vínculo:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

// 3. CRIAR VÍNCULO (COM TRAVA DE EXCLUSIVIDADE 1x1)
router.post('/', async (req, res) => {
  try {
    console.log('Recebendo dados brutos:', req.body);

    // 1. Captura a lista de UCs selecionadas
    const unidadesSelecionadas = req.body.unidades_selecionadas || [];

    // Tratamento automático de dados vazios
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
      observacoes: req.body.observacoes || null // <--- ADICIONE ESTA LINHA
    };

    const dadosValidados = vinculoSchema.parse(payload);

    // --- 1. TRAVA DE EXCLUSIVIDADE (1 USINA <-> 1 CONSUMIDOR) ---

    // A. Verifica se a USINA já está ocupada
    const { data: usinaOcupada, error: erroUsina } = await supabase
      .from('vinculos')
      .select('vinculo_id')
      .eq('usina_id', dadosValidados.usina_id)
      .neq('status_id', 2) // Ignora contratos encerrados
      .maybeSingle();

    if (erroUsina) throw erroUsina;

    if (usinaOcupada) {
      return res.status(400).json({
        error: 'Operação Bloqueada',
        detalhes: [
          'Esta Usina já possui um contrato ativo.',
          'Regra de Exclusividade: A usina só pode atender um cliente por vez.'
        ]
      });
    }

    // B. Verifica se o CONSUMIDOR já tem contrato
    // (Aqui estava o erro: mudei o nome da variável de erro para evitar conflito)
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
        detalhes: [
          'Este Consumidor já possui um contrato ativo.',
          'Regra de Exclusividade: O cliente só pode ter vínculo com uma usina por vez.'
        ]
      });
    }
    // ------------------------------------------------------------

    // --- VALIDAÇÃO DE CAPACIDADE (Mantemos apenas para garantir 100%) ---
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
        detalhes: [
          `A usina já tem ${totalUsado}% alocado.`,
          `Disponível: ${disponivel}%.`,
          `Você tentou alocar: ${dadosValidados.percentual}%.`
        ]
      });
    }
    // --- FIM DA VALIDAÇÃO ---

    // 2. Salva o Vínculo Pai
    const { data: novoVinculo, error } = await supabase
      .from('vinculos')
      .insert([dadosValidados])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      throw error;
    }

    // 3. Salva as UCs na tabela de ligação
    if (unidadesSelecionadas.length > 0 && novoVinculo.vinculo_id) {
      const ucsParaInserir = unidadesSelecionadas.map(ucId => ({
        vinculo_id: novoVinculo.vinculo_id,
        unidade_consumidora_id: ucId
      }));

      const { error: erroUcs } = await supabase
        .from('vinculos_unidades')
        .insert(ucsParaInserir);

      if (erroUcs) {
        console.error('Erro ao salvar UCs do vínculo:', erroUcs);
      }
    }

    res.status(201).json(novoVinculo);

  } catch (error) {
    console.error('Erro ao criar vínculo:', error);

    if (error instanceof z.ZodError) {
      const mensagens = error.errors ? error.errors.map(e => e.message) : ['Dados inválidos'];
      return res.status(400).json({
        error: 'Dados inválidos',
        detalhes: mensagens
      });
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
    console.error('Erro ao atualizar:', error);
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
    console.error('Erro ao encerrar:', error);
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
    console.error('Erro ao deletar:', error);
    res.status(500).json({ error: 'Erro ao excluir vínculo' });
  }
});

export default router;
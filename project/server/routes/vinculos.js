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
  data_fim: z.string().optional().nullable()
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

// 2. BUSCAR UM (FALTAVA ISSO!)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        usinas (usina_id, nome_proprietario, tipo),
        consumidores (consumidor_id, nome, cidade, uf),
        status (*)
      `)
      .eq('vinculo_id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Vínculo não encontrado' });

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar detalhe do vínculo:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculo' });
  }
});

// 3. CRIAR VÍNCULO (COM PROTEÇÃO)
router.post('/', async (req, res) => {
  try {
    console.log('Recebendo dados brutos:', req.body);

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
      data_fim: req.body.data_fim || null
    };

    console.log('Dados tratados para salvar:', payload);

    const dadosValidados = vinculoSchema.parse(payload);

    const { data, error } = await supabase
      .from('vinculos')
      .insert([dadosValidados])
      .select()
      .single();

    if (error) {
        console.error("Erro Supabase:", error);
        throw error;
    }

    res.status(201).json(data);

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
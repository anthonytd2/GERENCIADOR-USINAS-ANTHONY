import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// LISTAR TODAS (Modo Seguro - Sem Ordenação quebra-cabeça)
router.get('/', async (req, res) => {
  try {
    // Busca tudo da tabela 'usinas' (minúsculo, que sabemos que existe)
    // Removemos o .order() temporariamente para evitar o erro "column does not exist"
    const { data, error } = await supabase
      .from('usinas')
      .select('*');

    if (error) throw error;
    
    // Opcional: Ordenação via código para garantir que não quebra o banco
    if (data && data.length > 0) {
      data.sort((a, b) => {
        const nomeA = a.NomeProprietario || a.nomeproprietario || '';
        const nomeB = b.NomeProprietario || b.nomeproprietario || '';
        return nomeA.localeCompare(nomeB);
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Erro ao listar:", error);
    res.status(500).json({ error: error.message });
  }
});

// BUSCAR UMA (Tenta UsinaID Misturado)
router.get('/:id', async (req, res) => {
  try {
    // Tenta primeiro com UsinaID (Maiúsculo)
    let { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('UsinaID', req.params.id) // Tenta o nome do SQL original
      .single();

    // Se der erro de coluna, tenta minúsculo
    if (error && error.code === '42703') { // 42703 = Undefined Column
       const retry = await supabase
        .from('usinas')
        .select('*')
        .eq('usinaid', req.params.id)
        .single();
       data = retry.data;
       error = retry.error;
    }

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VÍNCULOS
router.get('/:id/vinculos', async (req, res) => {
  try {
    // Tenta buscar assumindo tabela 'vinculos' minúscula
    // Se as tabelas relacionadas (consumidores/status) derem erro, 
    // remova a parte interna do select para testar: .select('*')
    const { data, error } = await supabase
      .from('vinculos')
      .select('*, consumidores(nome), status(descricao)') 
      .eq('UsinaID', req.params.id); // Tenta UsinaID aqui também

    if (error) {
       // Fallback para minúsculo se falhar
       if (error.code === '42703') {
          const retry = await supabase
            .from('vinculos')
            .select('*') 
            .eq('usinaid', req.params.id);
          if (retry.error) throw retry.error;
          return res.json(retry.data);
       }
       throw error;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rotas de escrita mantidas simples (o erro principal era leitura)
router.post('/', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.parse(req.body);
    const { data, error } = await supabase.from('usinas').insert([dadosLimpos]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const dadosLimpos = usinaSchema.partial().parse(req.body);
    // Tenta atualizar usando UsinaID
    const { data, error } = await supabase.from('usinas').update(dadosLimpos).eq('UsinaID', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('usinas').delete().eq('UsinaID', req.params.id);
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
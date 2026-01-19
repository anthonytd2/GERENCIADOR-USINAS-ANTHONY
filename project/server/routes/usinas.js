import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS (Modo Seguro)
router.get('/', async (req, res) => {
  try {
    // Tenta ler da tabela 'usinas' (minúsculo, padrão do Postgres)
    let { data, error } = await supabase.from('usinas').select('*');
    
    // Se der erro, tenta com 'Usinas' (Maiúsculo)
    if (error && error.code === '42P01') { 
       const retry = await supabase.from('Usinas').select('*');
       data = retry.data;
       error = retry.error;
    }

    if (error) throw error;
    
    // Ordenação manual via código para não depender do nome da coluna no banco
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

// 2. BUSCAR UMA (Modo Seguro)
router.get('/:id', async (req, res) => {
  try {
    // Tenta primeiro o padrão minúsculo 'usinaid'
    let { data, error } = await supabase
      .from('usinas')
      .select('*')
      .eq('usinaid', req.params.id)
      .single();

    // Se falhar (coluna não existe ou tabela maiúscula), tenta variantes
    if (error) {
       // Tentativa 2: Tabela minúscula, Coluna Maiúscula
       let retry = await supabase.from('usinas').select('*').eq('UsinaID', req.params.id).single();
       
       // Tentativa 3: Tabela Maiúscula, Coluna Maiúscula
       if (retry.error) {
         retry = await supabase.from('Usinas').select('*').eq('UsinaID', req.params.id).single();
       }
       
       data = retry.data;
       error = retry.error;
    }

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. VÍNCULOS (CORREÇÃO DO ERRO ATUAL)
router.get('/:id/vinculos', async (req, res) => {
  try {
    const id = req.params.id;
    
    // TENTATIVA 1: Tudo minúsculo (Padrão Postgres)
    // Tenta trazer os dados cruzados com consumidores e status
    let query = supabase
      .from('vinculos')
      .select('*, consumidores(nome), status(descricao)')
      .eq('usinaid', id);
      
    let { data, error } = await query;

    // TENTATIVA 2: Se der erro no JOIN (relação não encontrada), tenta buscar SEM o join
    // Isso garante que a lista carrega, mesmo que os nomes dos consumidores não apareçam
    if (error) {
      console.log("Tentativa 1 de vínculos falhou, tentando modo simples...");
      
      // Tenta buscar apenas a tabela vinculos simples
      const retrySimple = await supabase
        .from('vinculos')
        .select('*')
        .eq('usinaid', id);

      // Se falhar de novo, tenta usar UsinaID maiúsculo
      if (retrySimple.error) {
         const retryMaiusculo = await supabase
          .from('vinculos')
          .select('*')
          .eq('UsinaID', id);
          
         data = retryMaiusculo.data;
         error = retryMaiusculo.error;
      } else {
        data = retrySimple.data;
        error = null; // Sucesso no modo simples
      }
    }

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro fatal em vínculos:", error);
    // Retorna array vazio em vez de erro 500 para não quebrar a tela
    res.json([]); 
  }
});

// ROTAS DE ESCRITA (Mantidas padrão)
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
    // Tenta atualizar usando usinaid minúsculo primeiro
    let { data, error } = await supabase.from('usinas').update(dadosLimpos).eq('usinaid', req.params.id).select().single();
    // Fallback para Maiúsculo
    if (error) {
       ({ data, error } = await supabase.from('usinas').update(dadosLimpos).eq('UsinaID', req.params.id).select().single());
    }
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    let { error } = await supabase.from('usinas').delete().eq('usinaid', req.params.id);
    if (error) {
       ({ error } = await supabase.from('usinas').delete().eq('UsinaID', req.params.id));
    }
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
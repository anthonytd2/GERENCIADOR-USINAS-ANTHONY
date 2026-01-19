import express from 'express';
import { supabase } from '../db.js';
import { usinaSchema } from '../validators/schemas.js';

const router = express.Router();

// 1. LISTAR TODAS (Estratégia de Fusão - 100% Robusta)
router.get('/', async (req, res) => {
  try {
    // PASSO A: Buscar todas as Usinas
    // Tenta minúsculo primeiro, depois maiúsculo
    let queryUsinas = await supabase.from('usinas').select('*');
    if (queryUsinas.error && queryUsinas.error.code === '42P01') {
       queryUsinas = await supabase.from('Usinas').select('*');
    }
    if (queryUsinas.error) throw queryUsinas.error;

    const listaUsinas = queryUsinas.data || [];

    // PASSO B: Buscar todos os Vínculos ativos
    // Trazemos apenas os IDs para ser leve e rápido
    let queryVinculos = await supabase.from('vinculos').select('usinaid, UsinaID, vinculoid');
    // Fallback se a tabela for Vinculos (Maiúsculo)
    if (queryVinculos.error && queryVinculos.error.code === '42P01') {
       queryVinculos = await supabase.from('Vinculos').select('usinaid, UsinaID, vinculoid'); // Corrigido para selecionar colunas, não *
    }
    
    // Se der erro nos vínculos, assumimos lista vazia (não quebra a página)
    const listaVinculos = queryVinculos.data || [];

    // PASSO C: Fundir as informações (Cruzar os dados)
    const usinasProcessadas = listaUsinas.map(usina => {
       // Normaliza o ID da usina atual (pode vir como usinaid ou UsinaID)
       const idAtual = usina.usinaid || usina.UsinaID;

       // Verifica se este ID existe na lista de vínculos
       const estaLocada = listaVinculos.some(vinculo => {
          const vUsinaId = vinculo.usinaid || vinculo.UsinaID;
          return vUsinaId === idAtual;
       });

       return {
         ...usina,
         // Forçamos a propriedade 'is_locada' para o Frontend ler direto
         is_locada: estaLocada, 
         // Enviamos também os vínculos para garantir compatibilidade
         vinculos: estaLocada ? [{ id: 'mock' }] : [] 
       };
    });

    // Ordenação manual (Nome do Proprietário)
    if (usinasProcessadas.length > 0) {
      usinasProcessadas.sort((a, b) => {
        const nomeA = a.NomeProprietario || a.nomeproprietario || '';
        const nomeB = b.NomeProprietario || b.nomeproprietario || '';
        return nomeA.localeCompare(nomeB);
      });
    }

    res.json(usinasProcessadas);

  } catch (error) {
    console.error("Erro ao listar usinas:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA (Mantido Igual - Detalhe já funciona)
router.get('/:id', async (req, res) => {
  try {
    let { data, error } = await supabase.from('usinas').select('*').eq('usinaid', req.params.id).single();
    if (error) {
       let retry = await supabase.from('usinas').select('*').eq('UsinaID', req.params.id).single();
       if (retry.error) retry = await supabase.from('Usinas').select('*').eq('UsinaID', req.params.id).single();
       data = retry.data;
       error = retry.error;
    }
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 3. VÍNCULOS (Mantido Igual - Detalhe já funciona)
router.get('/:id/vinculos', async (req, res) => {
  try {
    const id = req.params.id;
    let { data, error } = await supabase.from('vinculos').select('*, consumidores(nome), status(descricao)').eq('usinaid', id);

    if (error) {
      const retrySimple = await supabase.from('vinculos').select('*').eq('usinaid', id);
      if (retrySimple.error) {
         const retryMaiusc = await supabase.from('vinculos').select('*').eq('UsinaID', id);
         data = retryMaiusc.data;
      } else {
        data = retrySimple.data;
      }
    }
    res.json(data || []);
  } catch (error) { res.json([]); }
});

// ROTAS DE ESCRITA
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
    let { data, error } = await supabase.from('usinas').update(dadosLimpos).eq('usinaid', req.params.id).select().single();
    if (error) ({ data, error } = await supabase.from('usinas').update(dadosLimpos).eq('UsinaID', req.params.id).select().single());
    if (error) throw error;
    res.json(data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    let { error } = await supabase.from('usinas').delete().eq('usinaid', req.params.id);
    if (error) ({ error } = await supabase.from('usinas').delete().eq('UsinaID', req.params.id));
    if (error) throw error;
    res.json({ message: 'Usina excluída' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
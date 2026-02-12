import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// Rota: GET /api/relatorios/rentabilidade?mes=2026-01
router.get('/rentabilidade', async (req, res) => {
  try {
    const { mes } = req.query; // Espera formato 'YYYY-MM' (ex: 2026-01)

    // 1. Buscamos TODOS os fechamentos (Dados Financeiros)
    // (A tabela fechamentos ainda usa 'vinculo_id' como FK, então ok)
    const { data: fechamentos, error: erroFechamentos } = await supabase
      .from('fechamentos')
      .select('*');

    if (erroFechamentos) throw erroFechamentos;

    // 2. Buscamos TODOS os vínculos ATIVOS
    // CORREÇÃO AQUI: Mudamos vinculo_id -> id e nome_proprietario -> nome
    const { data: vinculos, error: erroVinculos } = await supabase
      .from('vinculos')
      .select(`
        id,
        consumidores (nome),
        usinas (nome)
      `);
      
    if (erroVinculos) throw erroVinculos;

    // 3. Processamento com FILTRO ANTI-LIXO (Registros Órfãos)
    const relatorio = fechamentos
      // Passo A: Filtra apenas o mês selecionado
      .filter(f => f.mes_referencia && f.mes_referencia.startsWith(mes))
      
      // Passo B: Só deixa passar se o vínculo ainda existir!
      .filter(item => {
        // CORREÇÃO: Compara o 'id' do vínculo (novo) com o 'vinculo_id' do fechamento (velho/FK)
        const existeVinculo = vinculos.find(v => v.id === item.vinculo_id);
        return !!existeVinculo; 
      })

      // Passo C: Formata os dados
      .map(item => {
        // CORREÇÃO: Busca pelo ID novo
        const vinculoInfo = vinculos.find(v => v.id === item.vinculo_id);
        
        const compensada = Number(item.energia_compensada) || 0;
        const spreadTotal = Number(item.spread) || 0;
        
        return {
          vinculo_id: item.vinculo_id,
          nome_consumidor: vinculoInfo?.consumidores?.nome || 'Desconhecido',
          // CORREÇÃO: Pega 'nome' da usina
          nome_usina: vinculoInfo?.usinas?.nome || 'Desconhecida',
          energia_compensada: compensada,
          spread: spreadTotal,
          // Cálculo do Spread Unitário
          spread_unitario: compensada > 0 ? (spreadTotal / compensada) : 0
        };
      })
      // Passo D: Ordena do maior lucro por kWh para o menor
      .sort((a, b) => b.spread_unitario - a.spread_unitario);

    // Retorna a lista limpa
    res.json(relatorio);

  } catch (error) {
    console.error('Erro ao buscar ranking de rentabilidade:', error);
    res.status(500).json({ error: 'Erro interno ao gerar relatório.' });
  }
});

export default router;
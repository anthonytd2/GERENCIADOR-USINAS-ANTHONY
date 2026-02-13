import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// ====================================================================
// ROTA 1: HISTÓRICO ANUAL DINÂMICO (Gráfico)
// ====================================================================
router.get('/historico', async (req, res) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();

    // 1. BUSCA TODOS OS VÍNCULOS
    const { data: todosVinculos } = await supabase
      .from('vinculos')
      .select(`
        status_id,
        data_inicio,
        data_fim,
        usinas(id, geracao_estimada),
        consumidores(consumidor_id, media_consumo)
      `);

    // 2. BUSCA TODAS AS FATURAS DO ANO (Realizado)
    const { data: faturasAno } = await supabase
      .from('auditorias_faturas')
      .select('data_leitura, creditos_injetados, creditos_consumidos')
      .gte('data_leitura', `${ano}-01-01`)
      .lte('data_leitura', `${ano}-12-31`);

    const historico = [];

    // 3. CALCULA MÊS A MÊS (Jan a Dez)
    for (let i = 0; i < 12; i++) {
      const nomeMes = new Date(ano, i, 1).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      const inicioDoMes = new Date(ano, i, 1);
      const fimDoMes = new Date(ano, i + 1, 0);

      let previstoGeracaoMes = 0;
      let previstoConsumoMes = 0;

      todosVinculos?.forEach(v => {
        const dIni = new Date(v.data_inicio);
        const dFim = v.data_fim ? new Date(v.data_fim) : null;

        // LÓGICA DE STATUS HISTÓRICO:
        // O vínculo conta para este mês se:
        // 1. Começou antes do fim deste mês.
        // 2. E o status NÃO é encerrado (id 2) OU se for encerrado, a data_fim é maior que o início deste mês.
        const estavaAtivoNoMes = dIni <= fimDoMes && (v.status_id !== 2 || (dFim && dFim >= inicioDoMes));

        if (estavaAtivoNoMes) {
          if (v.usinas) previstoGeracaoMes += Number(v.usinas.geracao_estimada || 0);
          if (v.consumidores) previstoConsumoMes += Number(v.consumidores.media_consumo || 0);
        }
      });

      const faturasMes = faturasAno?.filter(f => new Date(f.data_leitura).getMonth() === i) || [];
      const realizadoGeracao = faturasMes.reduce((acc, f) => acc + (Number(f.creditos_injetados) || 0), 0);
      const realizadoConsumo = faturasMes.reduce((acc, f) => acc + (Number(f.creditos_consumidos) || 0), 0);

      historico.push({
        name: nomeMes,
        PrevistoGeracao: previstoGeracaoMes,
        RealizadoGeracao: realizadoGeracao,
        PrevistoConsumo: previstoConsumoMes,
        RealizadoConsumo: realizadoConsumo
      });
    }

    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================================================================
// ROTA 2: RESUMO MENSAL (Cards de Números)
// ====================================================================
router.get('/', async (req, res) => {
  try {
    const { mes } = req.query; // YYYY-MM
    let dataReferencia = mes ? `${mes}-01` : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
    
    const [anoRef, mesRef] = dataReferencia.split('-');
    const inicioMes = new Date(anoRef, parseInt(mesRef) - 1, 1);
    const fimMes = new Date(anoRef, parseInt(mesRef), 0);

    const { data: vinculos } = await supabase
      .from('vinculos')
      .select('status_id, data_inicio, data_fim, usinas(geracao_estimada), consumidores(media_consumo)');

    let capTotal = 0;
    let consTotal = 0;

    vinculos?.forEach(v => {
      const dIni = new Date(v.data_inicio);
      const dFim = v.data_fim ? new Date(v.data_fim) : null;
      // Mesma lógica histórica para os cards
      const ativoNoPeriodo = dIni <= fimMes && (v.status_id !== 2 || (dFim && dFim >= inicioMes));

      if (ativoNoPeriodo) {
        if (v.usinas) capTotal += Number(v.usinas.geracao_estimada || 0);
        if (v.consumidores) consTotal += Number(v.consumidores.media_consumo || 0);
      }
    });

    const { data: auditorias } = await supabase
      .from('auditorias_vinculos')
      .select('faturas:auditorias_faturas(creditos_injetados, creditos_consumidos)')
      .eq('mes_referencia', dataReferencia);

    let gerReal = 0, consReal = 0;
    auditorias?.forEach(a => a.faturas?.forEach(f => {
      gerReal += Number(f.creditos_injetados || 0);
      consReal += Number(f.creditos_consumidos || 0);
    }));

    res.json({
      previsto: { geracao: capTotal, consumo: consTotal },
      realizado: { geracao: gerReal, consumo: consReal, mes: `${mesRef}/${anoRef}` },
      saldo: { previsto: capTotal - consTotal, realizado: gerReal - consReal }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/resumo', async (req, res) => {
  try {
    const { mes } = req.query;

    if (!mes) {
      return res.status(400).json({ error: 'Mês é obrigatório' });
    }

    // 1. Buscando as Contagens (Usinas, Consumidores, Vínculos)
    // O count: 'exact' conta quantos registros existem na tabela
    const { count: totalUsinas } = await supabase.from('usinas').select('*', { count: 'exact', head: true });
    const { count: totalConsumidores } = await supabase.from('consumidores').select('*', { count: 'exact', head: true });
    const { count: totalVinculos } = await supabase.from('vinculos').select('*', { count: 'exact', head: true });

    // 2. Buscando o Financeiro do Mês
    const dataInicio = `${mes}-01`;

    // --- CORREÇÃO: Calcula se o mês termina dia 28, 29, 30 ou 31 ---
    const [ano, mesNum] = mes.split('-');
    const ultimoDia = new Date(Number(ano), Number(mesNum), 0).getDate();
    const dataFim = `${mes}-${ultimoDia}`;

    const { data: fechamentos, error } = await supabase
      .from('fechamentos')
      .select('valor_recebido, spread')
      .gte('mes_referencia', dataInicio)
      .lte('mes_referencia', dataFim);

    if (error) throw error;

    // 3. Matemática Financeira (Conta de Padaria para não errar)
    const financeiro = fechamentos.reduce(
      (acc, item) => {
        const entrou = Number(item.valor_recebido) || 0;
        const sobrou = Number(item.spread) || 0; // Lucro

        acc.faturamento += entrou;
        acc.lucro += sobrou;
        return acc;
      },
      { faturamento: 0, lucro: 0 }
    );

    // O Custo é a diferença: Tudo que entrou MENOS o que sobrou de lucro.
    // Isso inclui Fio B, Fatura Geradora, Impostos, tudo.
    const custoReal = financeiro.faturamento - financeiro.lucro;

    // 4. Retorna tudo junto
    res.json({
      contadores: {
        usinas: totalUsinas || 0,
        consumidores: totalConsumidores || 0,
        vinculos: totalVinculos || 0
      },
      financeiro: {
        faturamento: financeiro.faturamento,
        custo: custoReal,
        lucro: financeiro.lucro
      }
    });

  } catch (error) {
    console.error('Erro no Dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar resumo.' });
  }
});

// --- CORREÇÃO DEFINITIVA: Rota Histórico ---
router.get('/historico', async (req, res) => {
  try {
    const hoje = new Date();
    const mesesParaBuscar = [];

    // 1. Gera a lista dos últimos 6 meses (ex: ['2025-08', '2025-09'...])
    for (let i = 5; i >= 0; i--) {
      // Cria uma data voltando 'i' meses
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesStr = d.toISOString().slice(0, 7); // Pega só YYYY-MM
      mesesParaBuscar.push(mesStr);
    }

    // 2. Proteção contra datas inválidas (O Bug do dia 31)

    // Data Inicial (Dia 01 é sempre seguro)
    const inicio = `${mesesParaBuscar[0]}-01`;

    // Data Final (Calcula o último dia real do mês)
    const mesFinal = mesesParaBuscar[5];
    const [anoFim, mesFimNum] = mesFinal.split('-');
    // O '0' no Date pega o último dia do mês anterior ao índice informado. 
    // Como mesFimNum é string "02", vira índice 2 (Março). Dia 0 de Março = Fim de Fevereiro.
    const ultimoDiaFim = new Date(Number(anoFim), Number(mesFimNum), 0).getDate();
    const fim = `${mesFinal}-${ultimoDiaFim}`;

    // 3. Busca no Banco
    const { data: dados, error } = await supabase
      .from('fechamentos')
      .select('mes_referencia, valor_recebido, spread')
      .gte('mes_referencia', inicio)
      .lte('mes_referencia', fim);

    if (error) throw error;

    // 4. Organiza os dados para o Gráfico
    const historico = mesesParaBuscar.map(mes => {
      // Filtra registros do mês atual do loop
      const registrosDoMes = dados.filter(d => d.mes_referencia && d.mes_referencia.startsWith(mes));

      // Soma
      const totais = registrosDoMes.reduce((acc, reg) => ({
        faturamento: acc.faturamento + (Number(reg.valor_recebido) || 0),
        lucro: acc.lucro + (Number(reg.spread) || 0)
      }), { faturamento: 0, lucro: 0 });

      // Formatação da Legenda (Ex: "Jan/26")
      const dataMes = new Date(mes + '-15'); // Dia 15 para evitar fuso horário
      const nomeMes = dataMes.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const anoDoMes = mes.split('-')[0].slice(2); // Pega '26' de '2026'

      return {
        mes: (nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)) + '/' + anoDoMes,
        faturamento: totais.faturamento,
        lucro: totais.lucro
      };
    });

    res.json(historico);

  } catch (error) {
    console.error('Erro CRÍTICO no histórico:', error);
    res.status(500).json({ error: 'Erro ao gerar gráfico' });
  }
});

export default router;
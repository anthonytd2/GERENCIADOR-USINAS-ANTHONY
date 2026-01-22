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
    const dataFim = `${mes}-31`;

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

export default router;
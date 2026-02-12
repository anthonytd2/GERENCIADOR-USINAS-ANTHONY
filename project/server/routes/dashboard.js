import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

router.get('/resumo', async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Mês é obrigatório' });

    // 1. Contadores
    const { count: totalUsinas } = await supabase.from('usinas').select('*', { count: 'exact', head: true });
    const { count: totalConsumidores } = await supabase.from('consumidores').select('*', { count: 'exact', head: true });
    const { count: totalVinculos } = await supabase.from('vinculos').select('*', { count: 'exact', head: true });

    // 2. Filtro Anti-Lixo (Vínculos Ativos)
    // CORREÇÃO: A tabela vinculos agora usa 'id' como chave primária
    const { data: listaVinculosAtivos } = await supabase.from('vinculos').select('id'); 
    
    // 3. Financeiro
    const dataInicio = `${mes}-01`;
    const [anoStr, mesStr] = mes.split('-');
    const ultimoDia = new Date(Number(anoStr), Number(mesStr), 0).getDate();
    const dataFim = `${mes}-${ultimoDia}`;

    // A tabela fechamentos ainda usa 'vinculo_id' como chave estrangeira
    const { data: fechamentos, error } = await supabase
      .from('fechamentos')
      .select('valor_recebido, spread, vinculo_id')
      .gte('mes_referencia', dataInicio)
      .lte('mes_referencia', dataFim);

    if (error) throw error;

    // Comparação: ID do Vínculo (id) === FK no Fechamento (vinculo_id)
    const financeiro = fechamentos
      .filter(item => listaVinculosAtivos ? listaVinculosAtivos.some(v => v.id === item.vinculo_id) : false)
      .reduce((acc, item) => {
        acc.faturamento += Number(item.valor_recebido) || 0;
        acc.lucro += Number(item.spread) || 0;
        return acc;
      }, { faturamento: 0, lucro: 0 });

    res.json({
      contadores: { usinas: totalUsinas || 0, consumidores: totalConsumidores || 0, vinculos: totalVinculos || 0 },
      financeiro: { faturamento: financeiro.faturamento, custo: financeiro.faturamento - financeiro.lucro, lucro: financeiro.lucro }
    });
  } catch (error) {
    console.error('Erro no Dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar resumo.' });
  }
});

// --- ROTA HISTÓRICO ---
router.get('/historico', async (req, res) => {
  try {
    const ano = req.query.ano || new Date().getFullYear();
    const mesesParaBuscar = [];
    for (let i = 1; i <= 12; i++) {
      const mesFormatado = `${ano}-${String(i).padStart(2, '0')}`;
      mesesParaBuscar.push(mesFormatado);
    }

    const inicio = `${ano}-01-01`;
    const fim = `${ano}-12-31`;

    // CORREÇÃO: Buscando 'id' na tabela vinculos
    const { data: listaVinculosAtivos } = await supabase.from('vinculos').select('id');

    const { data: dados, error } = await supabase
      .from('fechamentos')
      .select('mes_referencia, valor_recebido, spread, vinculo_id')
      .gte('mes_referencia', inicio)
      .lte('mes_referencia', fim);

    if (error) throw error;

    const historico = mesesParaBuscar.map(mes => {
      const registrosDoMes = dados.filter(d => {
        const isMesCorreto = d.mes_referencia && d.mes_referencia.startsWith(mes);
        // Comparação Corrigida: v.id === d.vinculo_id
        const isVinculoAtivo = listaVinculosAtivos 
          ? listaVinculosAtivos.some(v => v.id === d.vinculo_id) 
          : false;
        return isMesCorreto && isVinculoAtivo;
      });

      const totais = registrosDoMes.reduce((acc, reg) => ({
        faturamento: acc.faturamento + (Number(reg.valor_recebido) || 0),
        lucro: acc.lucro + (Number(reg.spread) || 0)
      }), { faturamento: 0, lucro: 0 });

      const [anoStr, mesStr] = mes.split('-');
      const dataMes = new Date(Number(anoStr), Number(mesStr) - 1, 15, 12, 0, 0); 
      let nomeMes = dataMes.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

      return {
        mes: nomeMes,
        mesCompleto: mes,
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
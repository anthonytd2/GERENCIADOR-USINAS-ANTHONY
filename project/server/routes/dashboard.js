import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// Rota Resumo (Cards) - Mantive igual, só conferindo o filtro anti-lixo
router.get('/resumo', async (req, res) => {
  try {
    const { mes } = req.query;
    if (!mes) return res.status(400).json({ error: 'Mês é obrigatório' });

    // 1. Contadores
    const { count: totalUsinas } = await supabase.from('usinas').select('*', { count: 'exact', head: true });
    const { count: totalConsumidores } = await supabase.from('consumidores').select('*', { count: 'exact', head: true });
    const { count: totalVinculos } = await supabase.from('vinculos').select('*', { count: 'exact', head: true });

    // 2. Filtro Anti-Lixo (Vínculos Ativos)
    const { data: listaVinculosAtivos } = await supabase.from('vinculos').select('vinculo_id');
    
    // 3. Financeiro
    const dataInicio = `${mes}-01`;
    const [ano, mesNum] = mes.split('-');
    const ultimoDia = new Date(Number(ano), Number(mesNum), 0).getDate();
    const dataFim = `${mes}-${ultimoDia}`;

    const { data: fechamentos, error } = await supabase
      .from('fechamentos')
      .select('valor_recebido, spread, vinculo_id')
      .gte('mes_referencia', dataInicio)
      .lte('mes_referencia', dataFim);

    if (error) throw error;

    const financeiro = fechamentos
      .filter(item => listaVinculosAtivos ? listaVinculosAtivos.some(v => v.vinculo_id === item.vinculo_id) : false)
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

// --- ROTA HISTÓRICO (ALTERADA PARA ANO COMPLETO) ---
router.get('/historico', async (req, res) => {
  try {
    // Pega o ano da URL (ex: ?ano=2026). Se não vier, usa o ano atual.
    const ano = req.query.ano || new Date().getFullYear();
    
    // 1. Gera os 12 meses do ano selecionado (Jan a Dez)
    const mesesParaBuscar = [];
    for (let i = 1; i <= 12; i++) {
      // Formata como "2026-01", "2026-02", etc.
      const mesFormatado = `${ano}-${String(i).padStart(2, '0')}`;
      mesesParaBuscar.push(mesFormatado);
    }

    // 2. Define intervalo de busca no banco (01/Jan a 31/Dez)
    const inicio = `${ano}-01-01`;
    const fim = `${ano}-12-31`;

    // 3. Busca Vínculos Ativos (Anti-Lixo)
    const { data: listaVinculosAtivos } = await supabase.from('vinculos').select('vinculo_id');

    // 4. Busca Fechamentos do Ano Todo
    const { data: dados, error } = await supabase
      .from('fechamentos')
      .select('mes_referencia, valor_recebido, spread, vinculo_id')
      .gte('mes_referencia', inicio)
      .lte('mes_referencia', fim);

    if (error) throw error;

    // 5. Organiza os dados mês a mês (Jan, Fev, Mar...)
    const historico = mesesParaBuscar.map(mes => {
      // Filtra registros do mês E que tenham vínculo ativo
      const registrosDoMes = dados.filter(d => {
        const isMesCorreto = d.mes_referencia && d.mes_referencia.startsWith(mes);
        const isVinculoAtivo = listaVinculosAtivos 
          ? listaVinculosAtivos.some(v => v.vinculo_id === d.vinculo_id) 
          : false;
        return isMesCorreto && isVinculoAtivo;
      });

      // Soma
      const totais = registrosDoMes.reduce((acc, reg) => ({
        faturamento: acc.faturamento + (Number(reg.valor_recebido) || 0),
        lucro: acc.lucro + (Number(reg.spread) || 0)
      }), { faturamento: 0, lucro: 0 });

      // Formatação da Legenda (Ex: "Jan", "Fev")
      const [anoStr, mesStr] = mes.split('-');
      // Hack para garantir nome do mês correto independente do fuso (Usa dia 15 ao meio dia)
      const dataMes = new Date(Number(anoStr), Number(mesStr) - 1, 15, 12, 0, 0); 
      let nomeMes = dataMes.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

      return {
        mes: nomeMes, // Agora mostra só "Jan", "Fev" (O ano já está no título)
        mesCompleto: mes, // Guarda "2026-01" para controle se precisar
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
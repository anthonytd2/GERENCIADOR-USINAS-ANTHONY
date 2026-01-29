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
    const { count: totalUsinas } = await supabase.from('usinas').select('*', { count: 'exact', head: true });
    const { count: totalConsumidores } = await supabase.from('consumidores').select('*', { count: 'exact', head: true });
    const { count: totalVinculos } = await supabase.from('vinculos').select('*', { count: 'exact', head: true });

    // --- NOVO: Buscamos a lista de IDs de Vínculos Ativos para filtrar o lixo ---
    const { data: listaVinculosAtivos } = await supabase
      .from('vinculos')
      .select('vinculo_id');
    
    // 2. Buscando o Financeiro do Mês
    const dataInicio = `${mes}-01`;

    const [ano, mesNum] = mes.split('-');
    const ultimoDia = new Date(Number(ano), Number(mesNum), 0).getDate();
    const dataFim = `${mes}-${ultimoDia}`;

    const { data: fechamentos, error } = await supabase
      .from('fechamentos')
      .select('valor_recebido, spread, vinculo_id') // Adicionei vinculo_id para checar
      .gte('mes_referencia', dataInicio)
      .lte('mes_referencia', dataFim);

    if (error) throw error;

    // 3. Matemática Financeira (Com Filtro Anti-Fantasma)
    const financeiro = fechamentos
      // FILTRO: Só deixa passar se o vínculo existe na lista de ativos
      .filter(item => {
        if (!listaVinculosAtivos) return false;
        return listaVinculosAtivos.some(v => v.vinculo_id === item.vinculo_id);
      })
      .reduce(
        (acc, item) => {
          const entrou = Number(item.valor_recebido) || 0;
          const sobrou = Number(item.spread) || 0; // Lucro

          acc.faturamento += entrou;
          acc.lucro += sobrou;
          return acc;
        },
        { faturamento: 0, lucro: 0 }
      );

    // O Custo é a diferença
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

// --- Rota Histórico (Com correção de Lixo) ---
router.get('/historico', async (req, res) => {
  try {
    const hoje = new Date();
    const mesesParaBuscar = [];

    // 1. Gera a lista dos últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesStr = d.toISOString().slice(0, 7);
      mesesParaBuscar.push(mesStr);
    }

    // 2. Datas de busca
    const inicio = `${mesesParaBuscar[0]}-01`;
    const mesFinal = mesesParaBuscar[5];
    const [anoFim, mesFimNum] = mesFinal.split('-');
    const ultimoDiaFim = new Date(Number(anoFim), Number(mesFimNum), 0).getDate();
    const fim = `${mesFinal}-${ultimoDiaFim}`;

    // --- NOVO: Busca Vínculos Ativos para o Histórico também ---
    const { data: listaVinculosAtivos } = await supabase
      .from('vinculos')
      .select('vinculo_id');

    // 3. Busca no Banco
    const { data: dados, error } = await supabase
      .from('fechamentos')
      .select('mes_referencia, valor_recebido, spread, vinculo_id')
      .gte('mes_referencia', inicio)
      .lte('mes_referencia', fim);

    if (error) throw error;

    // 4. Organiza os dados para o Gráfico
    const historico = mesesParaBuscar.map(mes => {
      // Filtra registros do mês atual E que tenham vínculo ativo
      const registrosDoMes = dados.filter(d => {
        const isMesCorreto = d.mes_referencia && d.mes_referencia.startsWith(mes);
        
        // FILTRO ANTI-FANTASMA
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

      // Formatação da Legenda
      const dataMes = new Date(mes + '-15');
      const nomeMes = dataMes.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      const anoDoMes = mes.split('-')[0].slice(2);

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
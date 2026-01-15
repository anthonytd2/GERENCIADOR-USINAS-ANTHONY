import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// --- FUNÇÕES DE CÁLCULO (A Lógica das Planilhas) ---

// Modelo 1: Usina de Injeção (Foco na Produção Total)
function calcularInjetada(usina, dados) {
  // Leitura Atual - Anterior
  const energiaInjetada = Number(dados.leituraAtual) - Number(dados.leituraAnterior);
  
  // Desconta consumo próprio
  const saldoLiberado = energiaInjetada - Number(dados.energiaCompensadaPropria || 0);
  
  // Preço Líquido = Preço Bruto (ex: 0.44) - Fio B da época
  const valorKwhLiquido = Number(usina.valorkwbruto || usina.valor_kwh_custo || 0) - Number(dados.valorFioB || 0);
  
  // Valor a Pagar = (Saldo * Preço Líquido) - Fatura Mínima da Usina
  const totalPagarGerador = (saldoLiberado * valorKwhLiquido) - Number(dados.valorFaturaGeradora || 0);

  return {
    energiaInjetada,
    saldoLiberado,
    valorKwhLiquido,
    totalPagarGerador,
    receitaBionova: 0 // Nesse modelo a Bionova não cobra "spread" direto na fatura
  };
}

// Modelo 2: Usina de Consumo (Foco no Cliente Final)
function calcularConsumida(usina, consumidor, dadosConsumidor, dadosUsina) {
  // 1. O que pagamos para o Dono da Usina
  const energiaCompensada = Number(dadosConsumidor.energiaCompensada);
  
  // Custo Bruto = Energia * Preço de Custo
  const valorBrutoGerador = energiaCompensada * Number(usina.valorkwbruto || usina.valor_kwh_custo || 0);
  
  // Rateio do Fio B (Proporcional à energia deste cliente)
  const custoFioB = energiaCompensada * Number(dadosUsina.valorFioB || 0);
  
  const liquidoPagarGerador = valorBrutoGerador - custoFioB;

  // 2. O que cobramos do Cliente (Receita Bionova)
  // Simulação: Quanto ele pagaria na Copel? (Tarifa cheia x Consumo Total)
  // Usamos um valor de tarifa padrão se não tiver no cadastro (ex: 1.10)
  const tarifaCopel = Number(consumidor.valorkw || 1.10); 
  const totalQuePagaria = Number(dadosConsumidor.consumo) * tarifaCopel;
  
  // Economia Bruta = O que pagaria na Copel - O que pagou de fato na fatura (Taxa Mínima)
  const economiaBruta = totalQuePagaria - Number(dadosConsumidor.valorPagoFatura);
  
  // Nossa parte (Bionova)
  // Cobramos: Economia Bruta - (Desconto do Cliente)
  const descontoClienteReais = economiaBruta * (Number(consumidor.percentualdesconto || 0) / 100);
  const valorBionova = economiaBruta - descontoClienteReais;

  return {
    liquidoPagarGerador,
    economiaBruta,
    descontoClienteReais,
    valorBionova,
    totalQuePagaria
  };
}

// --- ROTAS ---

// ROTA 1: SIMULAR (Chamada quando clica em "Calcular Fechamento")
router.post('/simular', async (req, res) => {
  try {
    const { usinaId, mesReferencia, leituras, consumidores } = req.body;
    
    // Busca Usina (Tenta maiúsculo e minúsculo por segurança)
    const usinaRes = await pool.query('SELECT * FROM "Usinas" WHERE "UsinaID" = $1', [usinaId]);
    // Fallback se a tabela estiver minúscula
    const usina = usinaRes.rows[0]; 
    
    if (!usina) return res.status(404).json({ error: 'Usina não encontrada' });

    let resultado = {};

    // Verifica o tipo de remuneração (Injetada ou Consumida)
    // Ajuste o nome do campo conforme seu banco (tipo_remuneracao ou tipopagamento)
    const tipo = usina.tipo_remuneracao || usina.tipopagamento || 'energia_consumida';

    if (tipo === 'energia_injetada') {
       resultado = calcularInjetada(usina, leituras);
    } 
    else {
       // Modelo Consumida
       const producao = Number(leituras.leituraAtual) - Number(leituras.leituraAnterior);
       
       const listaConsumidores = [];
       let totalPagarGerador = 0;
       let totalReceitaBionova = 0;

       // Loop pelos clientes para calcular um a um
       for (const item of consumidores) {
          const consRes = await pool.query('SELECT * FROM "Consumidores" WHERE "ConsumidorID" = $1', [item.id]);
          const consDb = consRes.rows[0];
          
          if(consDb) {
            const calculo = calcularConsumida(usina, consDb, item, leituras);
            
            totalPagarGerador += calculo.liquidoPagarGerador;
            totalReceitaBionova += calculo.valorBionova;

            listaConsumidores.push({
              nome: consDb.nome,
              ...calculo
            });
          }
       }
       
       // Abate fatura da usina do pagamento total
       totalPagarGerador -= Number(leituras.valorFaturaGeradora || 0);

       resultado = {
         producaoTotal: producao,
         totalPagarGerador,
         totalReceitaBionova,
         detalhesConsumidores: listaConsumidores
       };
    }

    res.json(resultado);

  } catch (error) {
    console.error('Erro na simulação:', error);
    res.status(500).json({ error: 'Erro ao simular fechamento' });
  }
});

// ROTA 2: SALVAR (Gravar no Banco Definitivamente)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Inicia Transação

    const { usinaId, mesReferencia, leituras, consumidores } = req.body;

    // 1. Salvar Produção
    const insertProducao = `
      INSERT INTO producao_usinas 
      (usina_id, mes_referencia, leitura_anterior, leitura_atual, energia_compensada_propria, valor_fio_b, valor_fatura_geradora)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const prodRes = await client.query(insertProducao, [
      usinaId, 
      mesReferencia, 
      leituras.leituraAnterior, 
      leituras.leituraAtual, 
      leituras.energiaCompensadaPropria,
      leituras.valorFioB,
      leituras.valorFaturaGeradora
    ]);
    const producaoId = prodRes.rows[0].id;

    // 2. Se tiver consumidores, salvar fechamentos individuais
    if (consumidores && consumidores.length > 0) {
      for (const item of consumidores) {
        // Recalculamos ou confiamos no frontend? Vamos confiar nos dados passados ou recalcular idealmente.
        // Aqui vamos salvar o básico para histórico
        
        await client.query(`
          INSERT INTO fechamentos 
          (consumidor_id, producao_id, mes_referencia, consumo_kwh, energia_compensada, valor_total_fatura_copel, economia_bruta, valor_final_cliente, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente')
        `, [
          item.id,
          producaoId,
          mesReferencia,
          item.consumo,
          item.energiaCompensada,
          item.valorPagoFatura,
          0, // economia_bruta (pode vir do item se o front mandar)
          0  // valor_final (pode vir do item se o front mandar)
        ]);
      }
    }

    await client.query('COMMIT'); // Confirma tudo
    res.json({ success: true, producaoId });

  } catch (error) {
    await client.query('ROLLBACK'); // Desfaz se der erro
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar fechamento' });
  } finally {
    client.release();
  }
});

export default router;
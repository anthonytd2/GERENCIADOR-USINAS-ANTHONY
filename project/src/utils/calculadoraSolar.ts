export interface DadosSimulacao {
  consumoKwh: number;
  valorTusd: number;
  valorTe: number;
  valorBandeira: number;
  valorIluminacao: number;
  valorOutros: number;
  fioB_Total: number;
  fioB_Percentual: number;
  valorPis: number;
  valorCofins: number;
  valorIcms: number;
  descontoBionova: number;
}

export const calcularEconomia = (d: DadosSimulacao) => {
  // 1. CÁLCULO DO CENÁRIO ATUAL (SEM SOLAR)
  // Custo Energia Pura = Consumo * (Tarifas)
  const custoEnergia = d.consumoKwh * (d.valorTusd + d.valorTe + d.valorBandeira);
  
  // Impostos Totais (Soma simples dos valores em R$ informados)
  const impostos = d.valorPis + d.valorCofins + d.valorIcms;
  
  // Fatura Atual Total
  const faturaAtual = custoEnergia + d.valorIluminacao + d.valorOutros + impostos;

  // 2. CÁLCULO DO CENÁRIO NOVO (COM SOLAR)
  // O cliente paga Fio B sobre a energia compensada
  // Custo Fio B = Consumo * TarifaFioB * (PercentualCobrado / 100)
  const custoFioB = d.consumoKwh * d.fioB_Total * (d.fioB_Percentual / 100);
  
  // Nova Fatura na Distribuidora (O que sobra pra pagar lá)
  // Ele paga: Iluminação + Outros + Fio B (O resto da energia é abatido)
  const novaFaturaDistribuidora = d.valorIluminacao + d.valorOutros + custoFioB;

  // 3. PAGAMENTO À USINA (BIONOVA)
  // Crédito Gerado = Valor da Energia que foi abatida (TUSD + TE + Bandeira)
  // A Bionova cobra esse valor com o desconto aplicado
  // Mas atenção: Para ser justo, descontamos o Fio B que ele já pagou na distribuidora
  // Fórmula de Locação: (Crédito - FioB) * (1 - Desconto) ou apenas Crédito * (1-Desconto)?
  // Vou usar a lógica de "Desconto Garantido sobre a Tarifa Cheia", ajustado para cobrir o Fio B.
  
  const creditoBruto = custoEnergia; 
  // Valor Cobrado Usina = (Crédito - CustoFioB) * (1 - Desconto%) 
  // Isso garante que o desconto incide sobre o "lucro" da operação
  const pagamentoUsina = (creditoBruto - custoFioB) * (1 - (d.descontoBionova / 100));

  // 4. RESULTADOS FINAIS
  const novoCustoTotal = novaFaturaDistribuidora + pagamentoUsina;
  const economiaRealCliente = faturaAtual - novoCustoTotal;
  const percentualReducaoTotal = faturaAtual > 0 ? (economiaRealCliente / faturaAtual) * 100 : 0;

  return {
    faturaAtual,
    novaFaturaDistribuidora,
    pagamentoUsina,
    novoCustoTotal,
    economiaRealCliente,
    percentualReducaoTotal,
    dadosOriginais: d,
    detalhes: {
        novoTusd: custoFioB
    }
  };
};
export interface DadosSimulacao {
  consumoKwh: number;
  valorTusd: number;      // R$ Total
  valorTe: number;        // R$ Total
  valorBandeira: number;  // R$ Total
  valorIluminacao: number; // R$ Total
  valorOutros: number;    // R$ Total
  fioB_Total: number;     // Tarifa Unitária (R$/kWh) ex: 0.1450
  fioB_Percentual: number; // % (ex: 60)
  valorPis: number;       // R$ Total
  valorCofins: number;    // R$ Total
  valorIcms: number;      // R$ Total
  descontoBionova: number; // %
}

export function calcularEconomia(dados: DadosSimulacao) {
  const consumo = dados.consumoKwh > 0 ? dados.consumoKwh : 1;

  // 1. Tarifas Unitárias (Calculadas a partir dos totais informados)
  const tarifaPisCofins = (dados.valorPis + dados.valorCofins) / consumo;
  const tarifaIcms = dados.valorIcms / consumo;
  
  // 2. Regra Fio B (Lei 14.300) - Custo Unitário que o cliente paga
  const fioB_Efetivo = dados.fioB_Total * (dados.fioB_Percentual / 100);
  
  // 3. Tarifa Irredutível (Obrigatória por kWh)
  // Soma dos impostos unitários + Fio B efetivo
  const tarifaIrredutivel = tarifaPisCofins + tarifaIcms + fioB_Efetivo;
  
  // 4. Novo TUSD (Custo Residual na Distribuidora referente à energia)
  // É o consumo multiplicado pela tarifa que não se consegue abater
  const novoTusd = consumo * tarifaIrredutivel;
  
  // 5. Economia Bruta (O quanto a usina conseguiu "matar" da conta)
  // Economia no TUSD = Valor Original - O que sobrou para pagar
  const reducaoTusd = dados.valorTusd - novoTusd;
  
  // A Economia Bruta é a soma de tudo que foi abatido:
  // TE inteira + Bandeira inteira + A parte do TUSD que sumiu
  const economiaBruta = dados.valorTe + dados.valorBandeira + (reducaoTusd > 0 ? reducaoTusd : 0);

  // 6. Divisão do Lucro
  // O cliente fica com X% dessa economia bruta (Desconto)
  const economiaRealCliente = economiaBruta * (dados.descontoBionova / 100);
  // A Usina fica com o resto (Assinatura)
  const pagamentoUsina = economiaBruta - economiaRealCliente;

  // 7. Totais Finais
  // Fatura Atual (Soma simples dos inputs)
  const faturaAtual = dados.valorTusd + dados.valorTe + dados.valorBandeira + dados.valorIluminacao + dados.valorOutros;
  
  // Nova Fatura Distribuidora = O novo TUSD (fio b + impostos) + Iluminação + Outros
  const novaFaturaDistribuidora = novoTusd + dados.valorIluminacao + dados.valorOutros;
  
  // Novo Custo Total = O que paga pra distribuidora + O que paga pra usina
  const novoCustoTotal = novaFaturaDistribuidora + pagamentoUsina;

  // 8. Indicadores Extras
  const percentualReducaoTotal = faturaAtual > 0 ? (economiaRealCliente / faturaAtual) * 100 : 0;

  return {
    faturaAtual,
    novaFaturaDistribuidora,
    pagamentoUsina,
    novoCustoTotal,
    economiaBruta,
    economiaRealCliente,
    percentualReducaoTotal,
    
    // Retornamos os dados originais também para facilitar o relatório
    dadosOriginais: dados,
    
    detalhes: {
      novoTusd,
      tarifaIrredutivel,
      reducaoTusd // Quanto economizou só no TUSD
    }
  };
}
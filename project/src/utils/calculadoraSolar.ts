export interface DadosSimulacao {
  consumoKwh: number;
  valorTusd: number;      // R$ Total (Ex: 500.00)
  valorTe: number;        // R$ Total (Ex: 400.00)
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

  // 1. Totais Finais (Cenário Atual)
  // Como os inputs já são os VALORES TOTAIS, basta somar.
  const faturaAtual = dados.valorTusd + dados.valorTe + dados.valorBandeira + dados.valorIluminacao + dados.valorOutros + dados.valorPis + dados.valorCofins + dados.valorIcms;

  // 2. Regra Fio B (Lei 14.300)
  // Calculamos quanto isso representa por kWh
  const tarifaPisCofins = (dados.valorPis + dados.valorCofins) / consumo;
  const tarifaIcms = dados.valorIcms / consumo;
  
  // Custo do Fio B unitário efetivo
  const fioB_UnitarioEfetivo = dados.fioB_Total * (dados.fioB_Percentual / 100);
  
  // 3. Tarifa Irredutível (Obrigatória por kWh que sobra na conta)
  const tarifaIrredutivel = tarifaPisCofins + tarifaIcms + fioB_UnitarioEfetivo;
  
  // 4. Novo TUSD (Custo Residual na Distribuidora referente à energia)
  // É o consumo multiplicado pela tarifa que não se consegue abater (Fio B + Impostos)
  const novoTusd = consumo * tarifaIrredutivel;
  
  // 5. Economia Bruta (O quanto a usina conseguiu "matar" da conta)
  // Economia no TUSD = Valor Original (R$) - O que sobrou para pagar (R$)
  const reducaoTusd = dados.valorTusd - novoTusd;
  
  // A Economia Bruta é a soma de tudo que foi abatido:
  // TE inteira + Bandeira inteira + A parte do TUSD que sumiu
  const economiaBruta = dados.valorTe + dados.valorBandeira + (reducaoTusd > 0 ? reducaoTusd : 0);

  // 6. Divisão do Lucro
  const economiaRealCliente = economiaBruta * (dados.descontoBionova / 100);
  const pagamentoUsina = economiaBruta - economiaRealCliente;

  // 7. Resultados Finais para a Nova Fatura
  // Nova Fatura Distribuidora = O novo TUSD (fio b + impostos) + Iluminação + Outros
  const novaFaturaDistribuidora = novoTusd + dados.valorIluminacao + dados.valorOutros;
  const novoCustoTotal = novaFaturaDistribuidora + pagamentoUsina;

  // 8. Indicadores Extras
  const percentualReducaoTotal = faturaAtual > 0 ? ((faturaAtual - novoCustoTotal) / faturaAtual) * 100 : 0;

  return {
    faturaAtual,
    novaFaturaDistribuidora,
    pagamentoUsina,
    novoCustoTotal,
    economiaBruta,
    economiaRealCliente,
    percentualReducaoTotal,
    
    dadosOriginais: dados,
    
    detalhes: {
      novoTusd,
      tarifaIrredutivel,
      reducaoTusd // Quanto economizou só no TUSD
    }
  };
}
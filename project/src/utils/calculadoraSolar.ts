export interface DadosSimulacao {
  consumoKwh: number;
  valorTusd: number;      // R$ Total
  valorTe: number;        // R$ Total
  valorBandeira: number;  // R$ Total
  valorIluminacao: number; // R$ Total
  valorOutros: number;    // R$ Total
  fioB_Total: number;     // Tarifa Unitária (ex: 0.1450)
  fioB_Percentual: number; // % (ex: 60)
  valorPis: number;       // R$ Total (Apenas informativo para taxa)
  valorCofins: number;    // R$ Total (Apenas informativo para taxa)
  valorIcms: number;      // R$ Total (Apenas informativo para taxa)
  descontoBionova: number; // %
}

export function calcularEconomia(dados: DadosSimulacao) {
  const consumo = dados.consumoKwh > 0 ? dados.consumoKwh : 1;

  // 1. TOTAIS FINAIS (CENÁRIO ATUAL)
  // CORREÇÃO: Não somamos PIS/COFINS/ICMS aqui porque eles já estão dentro do TUSD/TE
  const faturaAtual = dados.valorTusd + dados.valorTe + dados.valorBandeira + dados.valorIluminacao + dados.valorOutros;

  // 2. CÁLCULO DAS TARIFAS (Para achar o "Irredutível")
  const tarifaPisCofins = (dados.valorPis + dados.valorCofins) / consumo;
  const tarifaIcms = dados.valorIcms / consumo;
  
  // Regra Fio B (Lei 14.300)
  const fioB_UnitarioEfetivo = dados.fioB_Total * (dados.fioB_Percentual / 100);
  
  // 3. TARIFA IRREDUTÍVEL (Obrigatória por kWh que sobra na conta)
  const tarifaIrredutivel = tarifaPisCofins + tarifaIcms + fioB_UnitarioEfetivo;
  
  // 4. NOVO TUSD (Custo Residual na Distribuidora)
  const novoTusd = consumo * tarifaIrredutivel;
  
  // 5. ECONOMIA BRUTA
  // Economia TUSD = Valor Original - Novo Valor
  const reducaoTusd = dados.valorTusd - novoTusd;
  
  // A economia é tudo o que sumiu da conta:
  // TE inteira + Bandeira inteira + A redução do TUSD
  const economiaBruta = dados.valorTe + dados.valorBandeira + (reducaoTusd > 0 ? reducaoTusd : 0);

  // 6. DIVISÃO DO LUCRO
  const economiaRealCliente = economiaBruta * (dados.descontoBionova / 100);
  const pagamentoUsina = economiaBruta - economiaRealCliente;

  // 7. RESULTADOS FINAIS
  // Nova Fatura Distribuidora = Novo TUSD + Iluminação + Outros
  const novaFaturaDistribuidora = novoTusd + dados.valorIluminacao + dados.valorOutros;
  
  // Novo Custo Total = Distribuidora + Bionova
  const novoCustoTotal = novaFaturaDistribuidora + pagamentoUsina;

  // 8. INDICADORES
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
      reducaoTusd
    }
  };
}
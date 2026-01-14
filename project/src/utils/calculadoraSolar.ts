// src/utils/calculadoraSolar.ts

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

export function calcularEconomia(dados: DadosSimulacao) {
  const consumo = dados.consumoKwh > 0 ? dados.consumoKwh : 1;

  // 1. Tarifas Unitárias (R$/kWh)
  const tarifaPisCofins = (dados.valorPis + dados.valorCofins) / consumo;
  const tarifaIcms = dados.valorIcms / consumo;
  
  // 2. Regra Fio B (Lei 14.300)
  const fioB_Efetivo = dados.fioB_Total * (dados.fioB_Percentual / 100);
  
  // 3. Tarifa Irredutível (Obrigatória)
  const tarifaIrredutivel = tarifaPisCofins + tarifaIcms + fioB_Efetivo;
  
  // 4. Novo TUSD (O que sobra na conta da distribuidora referente a energia)
  const novoTusd = consumo * tarifaIrredutivel;
  
  // 5. Economia Bruta (O quanto a usina conseguiu "matar" da conta)
  const reducaoTusd = dados.valorTusd - novoTusd;
  const economiaBruta = dados.valorTe + dados.valorBandeira + (reducaoTusd > 0 ? reducaoTusd : 0);

  // 6. Divisão do Lucro
  const economiaRealCliente = economiaBruta * (dados.descontoBionova / 100);
  const pagamentoUsina = economiaBruta - economiaRealCliente;

  // 7. Totais Finais
  const faturaAtual = dados.valorTusd + dados.valorTe + dados.valorBandeira + dados.valorIluminacao + dados.valorOutros;
  
  const novaFaturaDistribuidora = novoTusd + dados.valorIluminacao + dados.valorOutros;
  const novoCustoTotal = novaFaturaDistribuidora + pagamentoUsina;

  // 8. Indicadores Extras (O que você pediu)
  const percentualReducaoTotal = faturaAtual > 0 ? (economiaRealCliente / faturaAtual) * 100 : 0;

  return {
    faturaAtual,             // Valor Fatura Hoje
    novaFaturaDistribuidora, // Nova conta (só distribuidora)
    pagamentoUsina,          // Valor a pagar para Usina
    novoCustoTotal,          // Total Com Bionova (Soma das duas acima)
    
    economiaBruta,           // Valor de Redução (Total abatido)
    economiaRealCliente,     // Economia Real (O dinheiro que sobra no bolso)
    
    percentualReducaoTotal,  // % Desconto sobre a fatura Total
    
    detalhes: {
      novoTusd,
      tarifaIrredutivel
    }
  };
}
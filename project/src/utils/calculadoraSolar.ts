// src/utils/calculadoraSolar.ts

export interface DadosSimulacao {
  consumoKwh: number;
  valorTusd: number;      // Valor em R$ da fatura
  valorTe: number;        // Valor em R$ da fatura
  valorBandeira: number;  // Valor em R$ da fatura
  valorIluminacao: number;// Valor em R$ da fatura
  valorOutros: number;    // Valor em R$ da fatura
  
  // NOVOS CAMPOS (Lei 14.300)
  fioB_Total: number;      // Ex: 0.1450 (Tarifa cheia)
  fioB_Percentual: number; // Ex: 60 (para 60% em 2026)
  
  valorPis: number;       // Valor em R$ da fatura
  valorCofins: number;    // Valor em R$ da fatura
  valorIcms: number;      // Valor em R$ da fatura (referente à TUSD)
  descontoBionova: number;// Ex: 20 (%)
}

export function calcularEconomia(dados: DadosSimulacao) {
  // Evita divisão por zero
  const consumo = dados.consumoKwh > 0 ? dados.consumoKwh : 1;

  // 1. Descobrir a Tarifa de Impostos por kWh (baseado no valor R$ que o cliente digitou)
  const tarifaPisCofins = (dados.valorPis + dados.valorCofins) / consumo;
  const tarifaIcms = dados.valorIcms / consumo;
  
  // 2. Calcular o Fio B que será cobrado (Regra de Transição)
  // Se o Fio B Total é 0.1450 e a regra é 60%, cobramos 0.087
  const fioB_Efetivo = dados.fioB_Total * (dados.fioB_Percentual / 100);
  
  // 3. Tarifa Irredutível (O custo por kWh que a usina NÃO consegue abater)
  // É a soma dos impostos + a parte do Fio B que a lei manda cobrar
  const tarifaIrredutivel = tarifaPisCofins + tarifaIcms + fioB_Efetivo;
  
  // 4. Novo TUSD (A "Nova Conta" da Distribuidora)
  // Multiplicamos o consumo pela tarifa que calculamos acima
  const novoTusd = consumo * tarifaIrredutivel;
  
  // 5. Redução no TUSD (Quanto a usina economizou no transporte)
  // É o TUSD que ele pagava antes MENOS o Novo TUSD
  const reducaoTusd = dados.valorTusd - novoTusd;
  
  // 6. Economia Bruta Total (O "Bolo")
  // Soma-se: TE Inteira + Bandeiras + O que conseguiu reduzir do TUSD
  const economiaBruta = dados.valorTe + dados.valorBandeira + (reducaoTusd > 0 ? reducaoTusd : 0);

  // 7. Divisão do Lucro
  const economiaRealCliente = economiaBruta * (dados.descontoBionova / 100);
  const pagamentoUsina = economiaBruta - economiaRealCliente;

  // 8. Custo Final Mensal do Cliente
  // Nova fatura da distribuidora (Novo TUSD + Ilum. + Outros) + Boleto Bionova
  const novaFaturaComSolar = novoTusd + dados.valorIluminacao + dados.valorOutros;
  const novoCustoTotal = novaFaturaComSolar + pagamentoUsina;

  return {
    faturaAtual: dados.valorTusd + dados.valorTe + dados.valorBandeira + dados.valorIluminacao + dados.valorOutros,
    novoTusd,
    novaFaturaComSolar,
    economiaBruta,
    economiaRealCliente,
    pagamentoUsina,
    novoCustoTotal,
    // Retornamos também os detalhes intermediários para conferência se precisar
    detalhes: {
      tarifaIrredutivel,
      fioB_Efetivo
    }
  };
}
export interface KitSolar {
  potencia: number;
  modulos: number;
  inversor: string;
  areaEstimada: number;
  geracaoMensalMedia: number;
  valorEstimado: number;
}

export interface ResultadoViabilidade {
  economiaMensalEstimada: number;
  economiaAnualEstimada: number;
  paybackAnos: number;
  roi: number;
  kitSugestao: KitSolar;
}

export const calcularViabilidade = (consumoMensal: number, valorTarifa: number): ResultadoViabilidade => {
  const HORAS_SOL_PICO = 4.5;
  const PERDA_SISTEMA = 0.20;
  const CUSTO_MEDIO_KWP = 3500;

  const consumo = Number(consumoMensal) || 0;
  const tarifa = Number(valorTarifa) || 0.95;

  const potenciaNecessaria = consumo / (30 * HORAS_SOL_PICO * (1 - PERDA_SISTEMA));
  const potenciaKit = Math.ceil(potenciaNecessaria * 2) / 2 || 0; 

  const geracaoMensal = potenciaKit * HORAS_SOL_PICO * 30 * (1 - PERDA_SISTEMA);
  const valorInvestimento = potenciaKit * CUSTO_MEDIO_KWP;
  const economiaMensal = Math.min(geracaoMensal, consumo) * tarifa;
  const economiaAnual = economiaMensal * 12;
  const payback = economiaAnual > 0 ? valorInvestimento / economiaAnual : 0;

  return {
    economiaMensalEstimada: economiaMensal,
    economiaAnualEstimada: economiaAnual,
    paybackAnos: parseFloat(payback.toFixed(1)),
    roi: 0,
    kitSugestao: {
      potencia: parseFloat(potenciaKit.toFixed(2)),
      modulos: Math.ceil(potenciaKit / 0.55),
      inversor: `${Math.ceil(potenciaKit)} kW`,
      areaEstimada: Math.ceil(potenciaKit / 0.55) * 2.5,
      geracaoMensalMedia: parseFloat(geracaoMensal.toFixed(0)),
      valorEstimado: valorInvestimento
    }
  };
};
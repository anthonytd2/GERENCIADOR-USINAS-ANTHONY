// Interface para o resultado
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
  roi: number; // Retorno sobre investimento
  kitSugestao: KitSolar;
}

// Lógica de Cálculo
export const calcularViabilidade = (consumoMensal: number, valorTarifa: number): ResultadoViabilidade => {
  // Constantes de mercado (Estimativas)
  const HORAS_SOL_PICO = 4.5; // Média Brasil
  const PERDA_SISTEMA = 0.20; // 20% de perdas (calor, cabos, sujeira)
  const CUSTO_MEDIO_KWP = 3500; // R$ 3.500,00 por kWp instalado

  // 1. Dimensionamento do Sistema
  // Fórmula: Potência = Consumo / (30 dias * Horas Sol * (1 - Perda))
  const potenciaNecessaria = consumoMensal / (30 * HORAS_SOL_PICO * (1 - PERDA_SISTEMA));
  
  // Arredonda para um kit comercial (ex: múltiplos de 0.5 kWp)
  const potenciaKit = Math.ceil(potenciaNecessaria * 2) / 2; 

  // 2. Geração Estimada
  const geracaoMensal = potenciaKit * HORAS_SOL_PICO * 30 * (1 - PERDA_SISTEMA);

  // 3. Financeiro
  const valorInvestimento = potenciaKit * CUSTO_MEDIO_KWP;
  const economiaMensal = Math.min(geracaoMensal, consumoMensal) * valorTarifa;
  const economiaAnual = economiaMensal * 12;

  // 4. Indicadores
  const payback = valorInvestimento / economiaAnual;
  const roi = ((economiaAnual * 25) - valorInvestimento) / valorInvestimento * 100; // ROI em 25 anos

  return {
    economiaMensalEstimada: economiaMensal,
    economiaAnualEstimada: economiaAnual,
    paybackAnos: parseFloat(payback.toFixed(1)),
    roi: parseFloat(roi.toFixed(1)),
    kitSugestao: {
      potencia: parseFloat(potenciaKit.toFixed(2)),
      modulos: Math.ceil(potenciaKit / 0.55), // Painéis de 550W
      inversor: `${Math.ceil(potenciaKit)} kW`,
      areaEstimada: Math.ceil(potenciaKit / 0.55) * 2.5, // 2.5m² por painel
      geracaoMensalMedia: parseFloat(geracaoMensal.toFixed(0)),
      valorEstimado: valorInvestimento
    }
  };
};
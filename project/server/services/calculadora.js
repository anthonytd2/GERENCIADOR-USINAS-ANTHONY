// Função auxiliar para arredondar com precisão (2 casas decimais)
const arredondar = (valor) => {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
};

export const calcularResultados = (dados) => {
  // 1. Extração dos dados brutos
  const valorFaturaConcessionaria = Number(dados.valorFatura) || 0;
  const energiaInjetada = Number(dados.energiaInjetada) || 0;
  const tarifaEnergia = Number(dados.tarifaEnergia) || 0;
  const percentualDesconto = Number(dados.percentualDesconto) || 0;
  
  // Novos campos para regras avançadas (com valores padrão se não vierem)
  const tusdFioB = Number(dados.tusdFioB) || 0; // Custo de disponibilidade/fio
  const aliguotaICMS = Number(dados.aliguotaICMS) || 0; // Ex: 18%

  // 2. Cálculos Base
  
  // Valor Bruto da Energia Injetada (Sem impostos/descontos)
  // Ex: 1000 kWh * R$ 0,90 = R$ 900,00
  const valorBrutoGeracao = arredondar(energiaInjetada * tarifaEnergia);

  // 3. Cálculos de Impostos e Custos (Se houver)
  // Se houver TUSD (Fio B) a ser cobrado sobre a injeção
  const custoFioB = arredondar(energiaInjetada * tusdFioB);
  
  // Se houver ICMS sobre a TUSD ou injeção (Cálculo simplificado)
  const custoICMS = arredondar(valorBrutoGeracao * (aliguotaICMS / 100));

  // 4. Cálculo da Economia Real
  // Economia = (O que ele gerou) - (Custos que ele teve para gerar/injetar)
  const economiaBruta = valorBrutoGeracao - custoFioB - custoICMS;

  // 5. Cálculo do Valor a Pagar para a Usina (Assinatura)
  // O cliente paga: (Economia) - (Desconto prometido)
  // Ex: Economizou 900. Desconto de 10% (90 reais). Paga 810.
  const valorDesconto = arredondar(economiaBruta * (percentualDesconto / 100));
  const valorAssinatura = arredondar(economiaBruta - valorDesconto);

  // 6. Cálculo da Economia Acumulada (Global)
  // Quanto ele deixou de gastar na concessionária + O desconto que ganhou
  // Na prática, para o cliente final: Economia = Valor do Desconto
  // Mas se considerarmos o total abatido:
  const totalAbatidoNaConta = economiaBruta;

  return {
    economia: economiaBruta,      // Quanto abateu na conta de luz
    valorDesconto: valorDesconto, // Quanto dinheiro ficou no bolso dele
    valorBoleto: valorAssinatura, // Quanto ele paga para você
    detalhes: {
      bruto: valorBrutoGeracao,
      custoFioB: custoFioB,
      impostos: custoICMS
    }
  };
};
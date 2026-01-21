// Definição Completa de Usina (como vem do Banco)
export interface Usina {
  usina_id: number;
  nome_proprietario: string;
  potencia: number;
  tipo: string;
  valor_kw_bruto: number;
  geracao_estimada: number;
  is_locada: boolean;
  inicio_contrato?: string;
  vencimento_contrato?: string;
  tipo_pagamento?: string;
  observacao?: string;
}

// Definição do Formulário de Usina (o que o usuário digita)
export interface UsinaFormInput {
  nome_proprietario: string;
  potencia: number | string;
  geracao_estimada: number | string;
  valor_kw_bruto: number | string;
  tipo: string;
  inicio_contrato?: string;
  vencimento_contrato?: string;
  tipo_pagamento?: string;
  observacao?: string;
}

// Definição Oficial do que é um Consumidor
export interface Consumidor {
  consumidor_id: number;
  nome: string;
  cidade?: string;
  uf?: string;
  documento?: string;
}

export interface VinculoFormInput {
  usina_id: string | number;
  consumidor_id: string | number;
  percentual: string | number;
  data_inicio: string;
  data_fim?: string; // <--- ADICIONE ESTA LINHA
  status_id?: number;
}

// Definição do Vínculo Completo (o que vem do Banco de Dados)
export interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  data_fim?: string;
  status: { descricao: string };
  // Aqui usamos as definições acima!
  usinas: Usina;
  consumidores: Consumidor;
}
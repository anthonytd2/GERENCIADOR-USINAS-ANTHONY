// Definição do que é uma Usina no seu sistema
export interface Usina {
  usina_id: number;
  nome_proprietario: string;
  potencia: number;
  tipo?: string;
}

// Definição do que é um Consumidor
export interface Consumidor {
  consumidor_id: number;
  nome: string;
  cidade?: string;
  uf?: string;
}

// Definição do que o formulário de Vínculo envia
export interface VinculoFormInput {
  usina_id: string | number;
  consumidor_id: string | number;
  percentual: string | number;
  data_inicio: string;
  status_id?: number;
}

// ... (mantenha o código anterior de Usina, Consumidor e VinculoFormInput)

// Adicione isto no final:
export interface VinculoDetalhado {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  data_fim?: string;
  status: { descricao: string };
  // Reutilizamos os tipos que já criamos antes!
  usinas: Usina;
  consumidores: Consumidor;
}
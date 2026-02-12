// src/types.ts

// ==========================================
// 0. USINAS (ADICIONADO AGORA)
// ==========================================
export interface Usina {
  id: number;              // Padronizado
  nome: string;            // Padronizado
  uc_usina?: string;       // Padronizado
  
  // Campos Legados (Para não quebrar código antigo enquanto migra)
  usina_id?: number;
  nome_proprietario?: string;
  numero_uc?: string; 

  // Dados Técnicos
  tipo: string;
  potencia: number;
  geracao_estimada: number;
  valor_kw_bruto: number;
  
  // Contrato
  inicio_contrato?: string;
  vencimento_contrato?: string;
  tipo_pagamento?: string; // 'INJETADO' | 'CONSUMO'
  
  // Proprietário
  cpf_cnpj?: string;
  rg?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  observacao?: string;
  
  // Status
  is_locada?: boolean;
}

export interface UsinaFormInput {
  nome: string;
  numero_uc: string;
  tipo: string;
  potencia: number | string;
  geracao_estimada: number | string;
  valor_kw_bruto: number | string;
  
  inicio_contrato: string;
  vencimento_contrato: string;
  tipo_pagamento: string;
  
  cpf_cnpj: string;
  rg: string;
  endereco: string;
  telefone: string;
  email: string;
  observacao: string;
}

// ==========================================
// 1. STATUS
// ==========================================
export interface Status {
  status_id: number;
  descricao: string;
}

// ==========================================
// 2. CONCESSIONÁRIAS
// ==========================================
export interface Concessionaria {
  id: number;
  nome: string;
  uf?: string;
  tarifa_fio_b_padrao?: number;
}

// ==========================================
// 3. UNIDADES CONSUMIDORAS (UCs)
// ==========================================
export interface UnidadeConsumidora {
  id: number;
  consumidor_id: number;
  codigo_uc: string;
  nota_fiscal_exemplo?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  media_consumo?: number;
  ativo?: boolean;
  created_at?: string;
}

// ==========================================
// 4. CONSUMIDORES
// ==========================================
export interface Consumidor {
  id: number; // Padronizado (era consumidor_id)
  consumidor_id?: number; // Legado
  nome: string;
  cpf_cnpj?: string; 
  documento?: string; // Legado
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  media_consumo?: number;
  percentual_desconto?: number;
  valor_kw?: number;
  tipo_desconto?: 'porcentagem' | 'valor_fixo' | string;
  tempo_contrato_anos?: number;
  inicio_contrato?: string; 
  vencimento_contrato?: string; 
  vendedor?: string;
  observacao?: string;
  unidade_consumidora?: string; 
  unidades_consumidoras_lista?: UnidadeConsumidora[];
}

export interface ConsumidorFormInput {
  nome: string;
  cpf_cnpj?: string;
  cidade?: string;
  uf?: string;
  media_consumo?: number | string;
  percentual_desconto?: number | string;
  valor_kw?: number | string;
  vendedor?: string;
  observacao?: string;
}

// ==========================================
// 6. VÍNCULOS (ALOCAÇÕES)
// ==========================================
export interface VinculoDetalhado {
  id: number;
  usina_id: number;
  consumidor_id: number;
  status_id: number;
  concessionaria_id?: number;

  // Dados do Vínculo
  percentual: number;
  data_inicio: string;
  data_fim?: string | null;
  observacao?: string | null; 
  observacoes?: string | null; 

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Relacionamentos (Joins)
  status?: { descricao: string };
  usinas?: Usina;
  consumidores?: Consumidor;

  // Tabela n-pra-n: vinculos_unidades
  unidades_vinculadas?: {
    id: number;
    unidades_consumidoras: {
      codigo_uc: string;
      endereco: string;
      bairro: string;
    }
  }[];
}

export interface VinculoFormInput {
  usina_id: string | number;
  consumidor_id: string | number;
  percentual: string | number;
  data_inicio: string;
  data_fim?: string;
  status_id?: number | string;
  observacoes?: string;
}

// ==========================================
// 7. FINANCEIRO (FECHAMENTOS)
// ==========================================
export interface Fechamento {
  fechamento_id: number;
  vinculo_id?: number;
  unidade_consumidora_id?: number;
  mes_referencia: string; 

  // Valores Calculados
  energia_compensada: number;
  valor_recebido: number;
  valor_pago: number;
  spread: number;

  // Detalhes da Conta
  tarifa_energia?: number;
  custo_fio_b?: number;
  impostos_taxas?: number;
  consumo_rede?: number;
  tarifa_kwh?: number;
  tusd_fio_b?: number;
  valor_fatura_geradora?: number;
  tarifa_com_imposto?: number;
  iluminacao_publica?: number;
  outras_taxas?: number;
  valor_pago_fatura?: number;
  economia_gerada?: number;
  total_fio_b?: number;
  total_bruto?: number;
  saldo_acumulado_kwh?: number;

  // Arquivos
  arquivo_url?: string;
  recibo_url?: string;

  created_at?: string;
  updated_at?: string;
}

export interface ProducaoUsina {
  id: number;
  usina_id: number;
  mes_referencia: string;
  leitura_anterior: number;
  leitura_atual: number;
  energia_injetada: number;
  energia_compensada_propria: number;
  saldo_liberado: number;
  valor_fio_b: number;
  valor_fatura_geradora: number;
}

// ==========================================
// 8. PROPOSTAS E DOCUMENTOS
// ==========================================
export interface Proposta {
  id: number;
  consumidor_id?: number;
  nome_cliente_prospect?: string;
  concessionaria_id?: number;

  dados_simulacao: {
    consumoMedia?: number;
    valorContaAtual?: number;
    economiaEstimada?: number;
    usinaSelecionada?: Usina;
    percentualDesconto?: number;
  };

  status: string; 
  arquivo_url?: string;
  created_at?: string;
}

export interface Documento { // Renomeado de cpf_cnpj para Documento (parecia erro)
  id: number;
  nome_arquivo: string;
  caminho_storage: string;
  tipo_entidade: string;
  entidade_id: number;
  tamanho_bytes?: number;
  created_at?: string;
}

export interface Recibo {
  id: number;
  consumidor_id: number;
  valor: number;
  data_emissao: string;
  referencia?: string;
  link_pdf?: string;
}

export interface AuditoriaVinculo {
  id: number;
  vinculo_id: number;
  mes_referencia: string;
  
  // Dados da Usina
  data_leitura_gerador?: string;
  data_leitura_consumidor?: string; 

  geracao_usina: number;
  consumo_proprio_usina: number;

  // Dados Totais
  saldo_anterior: number;
  creditos_injetados: number;
  creditos_consumidos: number;
  saldo_final: number;

  // Lista de Faturas
  faturas?: AuditoriaFatura[]; 

  status: string;
  observacao?: string;
  created_at?: string;
}

export interface AuditoriaFormInput {
  mes_referencia: string;
  geracao_total: number | string;
  consumo_proprio_usina: number | string;
  energia_injetada_fatura: number | string;
  consumo_rede_fatura: number | string;
  saldo_acumulado_fatura: number | string;
  observacao?: string;
}

export interface AuditoriaFatura {
  id?: number;
  unidade_id: number;
  percentual_aplicado: number;
  
  // Campos visuais
  codigo_uc?: string;
  endereco?: string;
  unidades_consumidoras?: {
    codigo_uc: string;
    endereco: string;
  };

  data_leitura?: string;
  saldo_anterior: number;
  creditos_injetados: number;
  creditos_consumidos: number;
  saldo_final: number;
}

export interface UnidadeVinculada {
  id: number; 
  vinculo_id: number;
  unidade_consumidora_id: number;
  percentual_rateio: number;
  unidades_consumidoras: {
    id: number;
    codigo_uc: string;
    endereco: string;
    bairro: string;
    cidade?: string;
  };
}
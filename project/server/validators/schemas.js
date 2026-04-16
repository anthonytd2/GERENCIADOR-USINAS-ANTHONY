import { z } from 'zod';

// Função auxiliar para números
const cleanNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val || String(val).trim() === '') return undefined;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) ? undefined : num;
};

// Função auxiliar para Strings Opcionais (Vazio vira NULL no banco)
const optionalString = z.string().nullish().transform(val => val || null);

// Validação de CPF (11) ou CNPJ (14)
const documentoRegex = /^(?:\d{11}|\d{14})$/;

// ==========================================
// SCHEMA DE USINAS
// ==========================================
export const usinaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: optionalString,
  tipo_pagamento: optionalString,
  inicio_contrato: optionalString,
  vencimento_contrato: optionalString,
  observacao: optionalString,

  // Documento: Remove pontos/traços e valida tamanho
  documento: z.string()
    .nullish()
    .refine(val => !val || documentoRegex.test(val.replace(/\D/g, '')), {
      message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos"
    })
    .transform(val => val ? val.replace(/\D/g, '') : null),

  rg: optionalString,
  inscricao_estadual: optionalString, 
  endereco_proprietario: optionalString,

  // Endereço
  cep: optionalString,
  bairro: optionalString,
  cidade: optionalString,
  uf: optionalString,

  telefone: optionalString,
  email: optionalString,

  // UC: Apenas remove caracteres não numéricos
  numero_uc: z.string()
    .nullish()
    .transform(val => val ? val.replace(/\D/g, '') : null),

  dia_vencimento_fatura: z.number().min(1).max(31).optional().nullable(),
  potencia: z.preprocess(cleanNumber, z.number({ required_error: "Potência é obrigatória" }).nonnegative()),
  valor_kw_bruto: z.preprocess(cleanNumber, z.number().nonnegative()),
  geracao_estimada: z.preprocess(cleanNumber, z.number().nonnegative()),
  valor_kwh_custo: z.preprocess(cleanNumber, z.number().optional()),
});


// ==========================================
// SCHEMA DE CONSUMIDORES
// ==========================================
export const consumidorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),

  // Documento: Usa a mesma regra das usinas (CPF/CNPJ limpos)
  documento: z.string()
    .nullish()
    .refine(val => !val || documentoRegex.test(val.replace(/\D/g, '')), {
      message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos"
    })
    .transform(val => val ? val.replace(/\D/g, '') : null),

  rg: optionalString,
  inscricao_estadual: optionalString, 
  email: optionalString,
  telefone: optionalString,
  cep: optionalString,
  endereco: optionalString,
  bairro: optionalString,
  cidade: optionalString,
  uf: optionalString,
  observacao: optionalString,

  // Credenciais da Copel
  login_copel: optionalString,
  senha_copel: optionalString,

  // 🟢 A CORREÇÃO DE OURO ESTÁ AQUI: Avisando o validador que este campo existe e pode passar!
  tipo_desconto: optionalString,

  // Numéricos (Opcionais pois dependem do tipo de contrato do cliente)
  media_consumo: z.preprocess(cleanNumber, z.number().nonnegative().optional()),
  percentual_desconto: z.preprocess(cleanNumber, z.number().nonnegative().optional()),
  valor_kw: z.preprocess(cleanNumber, z.number().nonnegative().optional()),
});


export const vinculoSchema = z.object({
  usina_id: z.number().int().positive(),
  consumidor_id: z.number().int().positive(),
  percentual: z.preprocess(cleanNumber, z.number().min(0).max(100).optional()),
  status: optionalString, 
});
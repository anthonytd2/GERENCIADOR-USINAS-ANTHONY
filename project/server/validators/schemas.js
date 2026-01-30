import { z } from 'zod';

// Função auxiliar
const cleanNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

// Função auxiliar para Strings Opcionais
const optionalString = z.string().nullish().transform(val => val || null); // Transforma vazio em NULL

export const usinaSchema = z.object({
  // Obrigatório
  nome_proprietario: z.string().min(1, "Nome é obrigatório"),
  
  // Opcionais (Agora "Consumo" ou "Injetado" passam aqui tranquilamente)
  tipo: optionalString,
  tipo_pagamento: optionalString, 
  inicio_contrato: optionalString,
  vencimento_contrato: optionalString,
  observacao: optionalString,
  tipo_remuneracao: optionalString, // Isso evita o erro de constraint "check" enviando NULL

  // Campos Novos
  cpf_cnpj: optionalString,
  rg: optionalString,
  endereco_proprietario: optionalString,
  telefone: optionalString,
  email: optionalString,
  numero_uc: optionalString,

  // Numéricos
  potencia: z.preprocess(cleanNumber, z.number().nonnegative()),
  valor_kw_bruto: z.preprocess(cleanNumber, z.number().nonnegative()),
  geracao_estimada: z.preprocess(cleanNumber, z.number().nonnegative()),
  valor_kwh_custo: z.preprocess(cleanNumber, z.number().optional()),
});
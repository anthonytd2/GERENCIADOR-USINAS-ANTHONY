import { z } from 'zod';

// Função para limpar números (converte string "10,50" para number 10.5)
const cleanNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Substitui vírgula por ponto e converte
  const num = Number(String(val).replace(',', '.'));
  return isNaN(num) ? 0 : num;
};

export const usinaSchema = z.object({
  // Campos de Texto
  nome_proprietario: z.string().min(1, "Nome é obrigatório"),
  tipo: z.string().optional().default('Solo'),
  tipo_pagamento: z.string().optional().or(z.literal('')),
  inicio_contrato: z.string().optional().or(z.literal('')),
  vencimento_contrato: z.string().optional().or(z.literal('')),
  observacao: z.string().optional().or(z.literal('')),
  tipo_remuneracao: z.string().optional().or(z.literal('')),

  // Campos Numéricos (Aceita 0 e converte string automaticamente)
  potencia: z.preprocess(cleanNumber, z.number().nonnegative()),
  valor_kw_bruto: z.preprocess(cleanNumber, z.number().nonnegative()),
  geracao_estimada: z.preprocess(cleanNumber, z.number().nonnegative()),
  valor_kwh_custo: z.preprocess(cleanNumber, z.number().optional()),
});
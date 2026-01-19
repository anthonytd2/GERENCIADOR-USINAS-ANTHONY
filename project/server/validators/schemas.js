import { z } from 'zod';

// Função auxiliar para converter string numérica em número de forma segura
const stringToNumber = (val) => {
  if (typeof val === 'number') return val;
  if (!val || val === '') return 0;
  return Number(String(val).replace(',', '.')); // Aceita vírgula ou ponto
};

export const usinaSchema = z.object({
  // Campos Obrigatórios
  nome_proprietario: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  
  // Campos Numéricos (com conversão segura)
  potencia: z.preprocess(stringToNumber, z.number().positive("Potência deve ser maior que zero")),
  valor_kw_bruto: z.preprocess(stringToNumber, z.number().positive("Valor do kW deve ser maior que zero")),
  geracao_estimada: z.preprocess(stringToNumber, z.number().nonnegative()),
  
  // Campos Opcionais (mas com valores padrão se vazios)
  tipo: z.string().default('Solo'),
  tipo_pagamento: z.string().optional().or(z.literal('')),
  
  inicio_contrato: z.string().optional().or(z.literal('')),
  vencimento_contrato: z.string().optional().or(z.literal('')),
  observacao: z.string().optional().or(z.literal('')),
  
  tipo_remuneracao: z.string().optional().or(z.literal('')),
  valor_kwh_custo: z.preprocess(stringToNumber, z.number().optional()),
});
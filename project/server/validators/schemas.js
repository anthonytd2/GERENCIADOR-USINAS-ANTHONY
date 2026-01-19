import { z } from 'zod';

export const usinaSchema = z.object({
  // Nomes atualizados para snake_case
  nome_proprietario: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  
  // Converte string para número se vier do formulário
  potencia: z.preprocess((val) => Number(val), z.number().positive()),
  
  tipo: z.string().optional(),
  
  valor_kw_bruto: z.preprocess((val) => Number(val), z.number().positive()),
  
  geracao_estimada: z.preprocess((val) => Number(val), z.number().nonnegative()),
  
  inicio_contrato: z.string().optional(),
  vencimento_contrato: z.string().optional(),
  tipo_pagamento: z.string().optional(),
  observacao: z.string().optional(),
  
  // Campos extras
  tipo_remuneracao: z.string().optional(),
  valor_kwh_custo: z.preprocess((val) => val ? Number(val) : 0, z.number().optional()),
});
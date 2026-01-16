import { z } from 'zod';

// REGRA 1: Consumidores
export const consumidorSchema = z.object({
  Nome: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
  // Remove tudo que não é número e verifica se tem 11 (CPF) ou 14 (CNPJ) dígitos
  Documento: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 11 || val.length === 14, "Documento inválido (CPF ou CNPJ)"),
  Email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  Telefone: z.string().optional(),
  // Garante que é número positivo
  PercentualDesconto: z.coerce.number().min(0, "Desconto não pode ser negativo").max(100, "Desconto máx é 100%"),
  MediaConsumo: z.coerce.number().min(0, "Consumo não pode ser negativo"),
});

// REGRA 2: Usinas
export const usinaSchema = z.object({
  NomeProprietario: z.string().min(3, "Nome do proprietário obrigatório"),
  // Verifica se a usina tem potência válida
  Potencia: z.coerce.number().positive("Potência deve ser maior que zero"),
  ValorKWBruto: z.coerce.number().positive("Valor do KW deve ser maior que zero"),
  ConcessionariaID: z.coerce.number().int().positive(),
  Tipo: z.string().optional(),
});

// REGRA 3: Propostas (CRM)
export const propostaSchema = z.object({
  nome_cliente_prospect: z.string().min(1, "Nome do cliente é obrigatório"),
  status: z.enum(['Rascunho', 'Enviada', 'Fechada', 'Perdida']).optional(),
  // Valida se o JSON da simulação tem os dados mínimos
  dados_simulacao: z.object({
    consumoKwh: z.coerce.number().positive(),
  }).passthrough(), // Aceita outros campos extras
});
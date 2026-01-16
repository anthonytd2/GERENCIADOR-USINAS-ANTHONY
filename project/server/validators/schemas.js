import { z } from 'zod';

// Validação para Consumidores
export const consumidorSchema = z.object({
  Nome: z.string().min(3, "Nome deve ter pelo menos 3 letras"),
  // Aceita string, remove não-números, verifica tamanho
  Documento: z.string().transform(val => val.replace(/\D/g, '')).refine(val => val.length === 11 || val.length === 14, "CPF/CNPJ inválido"),
  Telefone: z.string().optional(),
  Email: z.string().email("Email inválido").optional().or(z.literal('')),
  PercentualDesconto: z.coerce.number().min(0).max(100),
  MediaConsumo: z.coerce.number().min(0),
  // Adicione outros campos conforme necessário
});

// Validação para Usinas
export const usinaSchema = z.object({
  NomeProprietario: z.string().min(3, "Nome do proprietário é obrigatório"),
  Potencia: z.coerce.number().positive("Potência deve ser positiva"),
  ValorKWBruto: z.coerce.number().positive("Valor do KW deve ser positivo"),
  Tipo: z.enum(['Solo', 'Telhado']).optional(),
  ConcessionariaID: z.coerce.number().int().positive(),
});

// Validação para Propostas
export const propostaSchema = z.object({
  nome_cliente_prospect: z.string().min(1, "Nome do cliente é obrigatório"),
  dados_simulacao: z.object({
    consumoKwh: z.coerce.number().positive(),
    valorTusd: z.coerce.number(),
    // Valida que o objeto simulação tem o mínimo necessário
  }).passthrough(), // passthrough permite outros campos não listados aqui
  status: z.enum(['Rascunho', 'Enviada', 'Fechada', 'Perdida']).optional(),
});
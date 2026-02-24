// Adicionamos ': string | null | undefined' para o TypeScript parar de reclamar
export const formatarDocumento = (valor: string | null | undefined) => {
  if (!valor) return "Não informado";
  
  // Garantimos que o valor seja tratado como string
  const busca = String(valor).replace(/\D/g, '');

  if (busca.length === 11) {
    // Formata CPF: 000.000.000-00
    return busca.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (busca.length === 14) {
    // Formata CNPJ: 00.000.000/0000-00
    return busca.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return valor; 
};

export const formatarUC = (valor: string | null | undefined) => {
  if (!valor) return "N/A";
  return `UC: ${valor}`;
};
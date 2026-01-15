// src/lib/api.ts

// --- CONFIGURAÇÃO DE URL ---
// IMPORTANTE: Cole abaixo a URL do seu backend no Render (ex: https://meu-app.onrender.com)
// Não coloque a barra '/' no final.
const BASE_URL_RENDER = 'https://api-gestao-solar.onrender.com'; 

const API_URL = import.meta.env.PROD 
  ? `${BASE_URL_RENDER}/api`   // Produção (Vercel -> Render)
  : 'http://localhost:3000/api'; // Desenvolvimento (Localhost)

// --- FUNÇÃO DE REQUISIÇÃO (FETCH) ---
async function request(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${res.status}: Falha na requisição`);
    }

    // Se a resposta for 204 (No Content), retorna null
    if (res.status === 204) return null;

    return res.json();
  } catch (error) {
    console.error(`Erro na API [${endpoint}]:`, error);
    throw error;
  }
}

// --- GERADOR DE CRUD PADRÃO ---
// Cria automaticamente list, get, create, update e delete
function createCrud(resource: string) {
  return {
    list: () => request(`/${resource}`),
    get: (id: number | string) => request(`/${resource}/${id}`),
    create: (data: any) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: any) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number | string) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

// --- EXPORTAÇÃO DA API ---
export const api = {
  // Rotas Padrão
  consumidores: createCrud('consumidores'),
  usinas: createCrud('usinas'),
  vinculos: createCrud('vinculos'),
  recibos: createCrud('recibos'),
  concessionarias: createCrud('concessionarias'),
  propostas: createCrud('propostas'),
  
  // Rota Customizada: Fechamentos
  // Precisamos customizar porque o 'list' aqui exige um ID (do vínculo), diferente do padrão
  fechamentos: {
    list: (vinculoId: number | string) => request(`/fechamentos/${vinculoId}`), // <--- AQUI ESTÁ O AJUSTE IMPORTANTE
    create: (data: any) => request('/fechamentos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: any) => request(`/fechamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number | string) => request(`/fechamentos/${id}`, { method: 'DELETE' }),
  },
  
  // Método Genérico (para chamadas manuais se precisar)
  // Exemplo de uso: api.custom('/dashboard/resumo', 'GET')
  custom: (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) => 
    request(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
};
// src/lib/api.ts

// --- CONFIGURAÇÃO DE URL ---
const BASE_URL_RENDER = 'https://api-gestao-solar.onrender.com'; 
const API_URL = import.meta.env.PROD ? `${BASE_URL_RENDER}/api` : 'http://localhost:3000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detalhe || err.error || 'Erro na API');
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function createCrud(resource: string) {
  return {
    list: () => request(`/${resource}`),
    get: (id: number | string) => request(`/${resource}/${id}`),
    create: (data: any) => request(`/${resource}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: any) => request(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number | string) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  consumidores: createCrud('consumidores'),
  usinas: createCrud('usinas'),
  vinculos: createCrud('vinculos'),
  recibos: createCrud('recibos'),
  concessionarias: createCrud('concessionarias'),
  propostas: createCrud('propostas'),
  
  // NOVA CONFIGURAÇÃO FINANCEIRA
  financeiro: {
    list: (vinculoId: number | string) => request(`/financeiro/${vinculoId}`), 
    create: (data: any) => request('/financeiro', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: any) => request(`/financeiro/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number | string) => request(`/financeiro/${id}`, { method: 'DELETE' }),
  },

  custom: (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) => 
    request(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
};
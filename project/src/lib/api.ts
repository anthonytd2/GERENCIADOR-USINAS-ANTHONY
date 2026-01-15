// src/lib/api.ts

// --- CONFIGURAÇÃO DE URL ---
const BASE_URL_RENDER = 'https://api-gestao-solar.onrender.com'; 

const API_URL = import.meta.env.PROD 
  ? `${BASE_URL_RENDER}/api`
  : 'http://localhost:3000/api';

// --- FUNÇÃO DE REQUISIÇÃO (FETCH) ---
async function request(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));

      // AQUI ESTAVA O PROBLEMA: O backend manda 'motivo_real', não 'mensagem_tecnica'
      // Agora o alerta vai funcionar!
      if (errorData.motivo_real) {
        alert(`🚨 ERRO REAL DO BANCO:\n\n${errorData.motivo_real}`);
      } else if (errorData.mensagem_tecnica) {
        alert(`🚨 ERRO DO BANCO: ${errorData.mensagem_tecnica}`);
      }

      throw new Error(errorData.error || `Erro ${res.status}: Falha na requisição`);
    }

    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    console.error(`Erro na API [${endpoint}]:`, error);
    throw error;
  }
}

// --- GERADOR DE CRUD PADRÃO ---
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
  consumidores: createCrud('consumidores'),
  usinas: createCrud('usinas'),
  vinculos: createCrud('vinculos'),
  recibos: createCrud('recibos'),
  concessionarias: createCrud('concessionarias'),
  propostas: createCrud('propostas'),
  
  fechamentos: {
    list: (vinculoId: number | string) => request(`/fechamentos/${vinculoId}`), 
    create: (data: any) => request('/fechamentos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number | string, data: any) => request(`/fechamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number | string) => request(`/fechamentos/${id}`, { method: 'DELETE' }),
  },
  
  custom: (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any) => 
    request(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
};
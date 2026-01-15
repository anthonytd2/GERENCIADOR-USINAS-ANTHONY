// src/lib/api.ts

// AQUI ESTÁ A CORREÇÃO:
// Substitua a URL abaixo pela URL que você copiou do painel do Render
// NÃO esqueça de manter o "/api" no final.
const BASE_URL_RENDER = 'https://api-gestao-solar.onrender.com'; 

const API_URL = import.meta.env.PROD 
  ? `${BASE_URL_RENDER}/api` // Na internet: usa o Render
  : 'http://localhost:3000/api'; // No seu PC: usa localhost

async function request(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  // Log para ajudar a debugar se der erro
  console.log(`Requisitando: ${API_URL}${endpoint}`);

  const res = await fetch(`${API_URL}${endpoint}`, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Erro na requisição');
  }

  return res.json();
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
  fechamentos: createCrud('fechamentos'),
  
  custom: (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => 
    request(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
};
const API_URL = 'http://localhost:3000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

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
  fechamentos: createCrud('fechamentos'), // Rota específica para o financeiro
  
  // FUNÇÃO NECESSÁRIA PARA O FECHAMENTO FUNCIONAR:
  custom: (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) => 
    request(endpoint, { method, body: body ? JSON.stringify(body) : undefined }),
};
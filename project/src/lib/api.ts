// src/lib/api.ts

const API_URL = 'https://api-gestao-solar.onrender.com/api'; // Ou localhost se estiver testando local

async function request(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Erro na requisição');
  }

  // Verifica se tem conteúdo para retornar JSON (para casos de delete/204)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // ... (Mantenha os existentes: vinculos, usinas, consumidores, etc.) ...
  vinculos: {
    list: () => request('/vinculos'),
    get: (id: number) => request(`/vinculos/${id}`),
    create: (data: any) => request('/vinculos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/vinculos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/vinculos/${id}`, { method: 'DELETE' }),
  },
  usinas: {
    list: () => request('/usinas'),
    get: (id: number) => request(`/usinas/${id}`),
    create: (data: any) => request('/usinas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/usinas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/usinas/${id}`, { method: 'DELETE' }),
  },
  consumidores: {
    list: () => request('/consumidores'),
    get: (id: number) => request(`/consumidores/${id}`),
    create: (data: any) => request('/consumidores', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/consumidores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/consumidores/${id}`, { method: 'DELETE' }),
  },
  status: {
    list: () => request('/status'),
  },
  entidades: {
    list: () => request('/entidades'),
  },
  fechamentos: {
    list: (vinculoId: number) => request(`/fechamentos/${vinculoId}`),
    create: (data: any) => request('/fechamentos', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/fechamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/fechamentos/${id}`, { method: 'DELETE' }),
  },

  // --- NOVAS ROTAS (ADICIONE A PARTIR DAQUI) ---
  
  concessionarias: {
    list: () => request('/concessionarias'),
  },

  propostas: {
    list: (status?: string) => {
        // Se passar status, adiciona na URL (ex: ?status=Enviada)
        const query = status ? `?status=${status}` : '';
        return request(`/propostas${query}`);
    },
    create: (data: any) => request('/propostas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/propostas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/propostas/${id}`, { method: 'DELETE' }),
  }
};
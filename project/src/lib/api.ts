// ARQUIVO: project/src/lib/api.ts

// OBS: Lembre-se de manter o /api no final se estiver usando o Render
const API_BASE = 'https://api-gestao-solar.onrender.com/api'; 
// Se estiver rodando localmente no seu PC, use: 'http://localhost:3001/api'

export const api = {
  // --- MÓDULO DE CONSUMIDORES ---
  consumidores: {
    list: () => fetch(`${API_BASE}/consumidores`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/consumidores/${id}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/consumidores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/consumidores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/consumidores/${id}`, { method: 'DELETE' })
  },

  // --- MÓDULO DE USINAS ---
  usinas: {
    list: () => fetch(`${API_BASE}/usinas`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/usinas/${id}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/usinas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/usinas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/usinas/${id}`, { method: 'DELETE' })
  },

  // --- MÓDULO DE STATUS (Pequeno auxiliar) ---
  status: {
    list: () => fetch(`${API_BASE}/status`).then(r => r.json())
  },

  // --- MÓDULO DE VÍNCULOS ---
  vinculos: {
    list: () => fetch(`${API_BASE}/vinculos`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/vinculos/${id}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/vinculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/vinculos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/vinculos/${id}`, { method: 'DELETE' })
  }, 
  // <--- OLHA A VÍRGULA AQUI! Ela separa o bloco de cima do bloco novo.

  // --- NOVO MÓDULO: FECHAMENTOS (FINANCEIRO) ---
  fechamentos: {
    // Busca a lista de fechamentos de um vínculo específico
    list: (vinculoId: number) => fetch(`${API_BASE}/fechamentos/${vinculoId}`).then(r => r.json()),
    
    // Cria um novo lançamento financeiro
    create: (data: any) => fetch(`${API_BASE}/fechamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
    
    // Deleta um lançamento errado
    delete: (id: number) => fetch(`${API_BASE}/fechamentos/${id}`, { method: 'DELETE' })
  }

}; // Fim do objeto "api"
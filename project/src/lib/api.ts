// ARQUIVO: project/src/lib/api.ts
const API_BASE = 'https://api-gestao-solar.onrender.com/api'; 
// Use 'http://localhost:3001/api' se estiver rodando localmente

export const api = {
  consumidores: {
    list: () => fetch(`${API_BASE}/consumidores`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/consumidores/${id}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/consumidores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/consumidores/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/consumidores/${id}`, { method: 'DELETE' })
  },
  usinas: {
    list: () => fetch(`${API_BASE}/usinas`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/usinas/${id}`).then(r => r.json()),
    vinculos: (id: number) => fetch(`${API_BASE}/usinas/${id}/vinculos`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/usinas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/usinas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/usinas/${id}`, { method: 'DELETE' })
  },
  status: {
    list: () => fetch(`${API_BASE}/status`).then(r => r.json())
  },
  vinculos: {
    list: () => fetch(`${API_BASE}/vinculos`).then(r => r.json()),
    get: (id: number) => fetch(`${API_BASE}/vinculos/${id}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/vinculos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/vinculos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/vinculos/${id}`, { method: 'DELETE' })
  }, 
  entidades: {
    list: () => fetch(`${API_BASE}/entidades`).then(res => res.json()),
    create: (data: any) => fetch(`${API_BASE}/entidades`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
    update: (id: number, data: any) => fetch(`${API_BASE}/entidades/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
    delete: (id: number) => fetch(`${API_BASE}/entidades/${id}`, { method: 'DELETE' }),
  },
  fechamentos: {
    list: (vinculoId: number) => fetch(`${API_BASE}/fechamentos/${vinculoId}`).then(r => r.json()),
    create: (data: any) => fetch(`${API_BASE}/fechamentos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    // NOVA FUNÇÃO UPDATE
    update: (id: number, data: any) => fetch(`${API_BASE}/fechamentos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    delete: (id: number) => fetch(`${API_BASE}/fechamentos/${id}`, { method: 'DELETE' })
  }
};
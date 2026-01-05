const API_BASE = 'http://localhost:3001/api';

export const api = {
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
    delete: (id: number) => fetch(`${API_BASE}/consumidores/${id}`, {
      method: 'DELETE'
    }),
    vinculos: (id: number) => fetch(`${API_BASE}/consumidores/${id}/vinculos`).then(r => r.json())
  },
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
    delete: (id: number) => fetch(`${API_BASE}/usinas/${id}`, {
      method: 'DELETE'
    }),
    vinculos: (id: number) => fetch(`${API_BASE}/usinas/${id}/vinculos`).then(r => r.json())
  },
  status: {
    list: () => fetch(`${API_BASE}/status`).then(r => r.json())
  },
  vinculos: {
    list: () => fetch(`${API_BASE}/vinculos`).then(r => r.json()),
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
    delete: (id: number) => fetch(`${API_BASE}/vinculos/${id}`, {
      method: 'DELETE'
    })
  }
};

import axios from 'axios';

// Verifica se está rodando local ou em produção
const isLocal = window.location.hostname === 'localhost';
const API_BASE = isLocal 
  ? 'http://localhost:3001/api' 
  : 'https://api-gestao-solar.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  usinas: {
    list: () => axiosInstance.get('/usinas').then((res: any) => res.data),
    get: (id: number) => axiosInstance.get(`/usinas/${id}`).then((res: any) => res.data),
    vinculos: (id: number) => axiosInstance.get(`/usinas/${id}/vinculos`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/usinas', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/usinas/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/usinas/${id}`).then((res: any) => res.data),
  },
  consumidores: {
    list: () => axiosInstance.get('/consumidores').then((res: any) => res.data),
    get: (id: number) => axiosInstance.get(`/consumidores/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/consumidores', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/consumidores/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/consumidores/${id}`).then((res: any) => res.data),
  },
  vinculos: {
    list: () => axiosInstance.get('/vinculos').then((res: any) => res.data),
    get: (id: number) => axiosInstance.get(`/vinculos/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/vinculos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/vinculos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/vinculos/${id}`).then((res: any) => res.data),
  },
  status: {
    list: () => axiosInstance.get('/status').then((res: any) => res.data),
  },
  entidades: {
    list: () => axiosInstance.get('/entidades').then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/entidades', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/entidades/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/entidades/${id}`).then((res: any) => res.data),
  },
  
  // --- ADICIONADO: Concessionárias (Correção do Erro) ---
  concessionarias: {
    list: () => axiosInstance.get('/concessionarias').then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/concessionarias', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/concessionarias/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/concessionarias/${id}`).then((res: any) => res.data),
  },

propostas: {
    list: () => axiosInstance.get('/propostas').then((res: any) => res.data),
    // NOVO: GET ONE
    get: (id: number) => axiosInstance.get(`/propostas/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/propostas', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/propostas/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/propostas/${id}`).then((res: any) => res.data),
  },

  fechamentos: {
    list: (vinculoId: number) => axiosInstance.get(`/fechamentos/${vinculoId}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/fechamentos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/fechamentos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/fechamentos/${id}`).then((res: any) => res.data),
  },

  financeiro: {
    list: (vinculoId: number) => axiosInstance.get(`/fechamentos/${vinculoId}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/fechamentos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/fechamentos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/fechamentos/${id}`).then((res: any) => res.data),
  },
  
  get: (url: string) => axiosInstance.get(url).then((res: any) => res.data),
  post: (url: string, data: any) => axiosInstance.post(url, data).then((res: any) => res.data),
  put: (url: string, data: any) => axiosInstance.put(url, data).then((res: any) => res.data),
  delete: (url: string) => axiosInstance.delete(url).then((res: any) => res.data),
};
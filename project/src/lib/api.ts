import axios from 'axios';

// --- CONFIGURAÇÃO DA BASE URL ---
// 1. Tenta pegar a variável de ambiente (Vercel/Produção)
// 2. Se não existir, assume que é Localhost (Seu PC) na porta 3000
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔌 Conectado à API:', API_BASE); // Para você conferir no F12 (Console)

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- OBJETO API COMPLETO ---
export const api = {
  // Configuração genérica (caso precise acessar o axios direto)
  client: axiosInstance,

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

    // Função Especial para Encerrar Contrato
    encerrar: (id: number, dataFim: string) => axiosInstance.put(`/vinculos/${id}/encerrar`, { data_fim: dataFim }).then((res: any) => res.data),

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

  concessionarias: {
    list: () => axiosInstance.get('/concessionarias').then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/concessionarias', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/concessionarias/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/concessionarias/${id}`).then((res: any) => res.data),
  },

  propostas: {
    list: () => axiosInstance.get('/propostas').then((res: any) => res.data),
    get: (id: number) => axiosInstance.get(`/propostas/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/propostas', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/propostas/${id}`, data).then((res: any) => res.data),
    converter: (id: number) => axiosInstance.post(`/propostas/${id}/converter`).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/propostas/${id}`).then((res: any) => res.data),
  },

  dashboard: {
    getResumo: async (mes: string) => {
      // mes deve ser "YYYY-MM"
      const response = await axiosInstance.get(`/dashboard/resumo?mes=${mes}`);
      return response.data;
    }
  },

  // Mantendo compatibilidade com códigos antigos que chamam 'financeiro' ou 'fechamentos'
  fechamentos: {
    list: (vinculoId: number) => axiosInstance.get(`/fechamentos/${vinculoId}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/fechamentos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/fechamentos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/fechamentos/${id}`).then((res: any) => res.data),
  },

  documentos: {
    list: (tipo: string, id: number) => axiosInstance.get(`/documentos/${tipo}/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/documentos', data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/documentos/${id}`).then((res: any) => res.data),
  },

  // Alias para fechamentos (caso seu frontend use 'financeiro')
  financeiro: {
    list: (vinculoId: number) => axiosInstance.get(`/fechamentos/${vinculoId}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/fechamentos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/fechamentos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/fechamentos/${id}`).then((res: any) => res.data),
  },

  // Métodos genéricos auxiliares
  get: (url: string) => axiosInstance.get(url).then((res: any) => res.data),
  post: (url: string, data: any) => axiosInstance.post(url, data).then((res: any) => res.data),
  put: (url: string, data: any) => axiosInstance.put(url, data).then((res: any) => res.data),
  delete: (url: string) => axiosInstance.delete(url).then((res: any) => res.data),
};
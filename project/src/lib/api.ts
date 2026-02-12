import axios from 'axios';

// --- CONFIGURAÇÃO DA BASE URL ---
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔌 Conectado à API:', API_BASE);

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- OBJETO API COMPLETO ---
export const api = {
  // Configuração genérica
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

    // Filiais (UCs)
    getUnidades: (id: number) => axiosInstance.get(`/consumidores/${id}/unidades`).then((res: any) => res.data),
    createUnidade: (id: number, data: any) => axiosInstance.post(`/consumidores/${id}/unidades`, data).then((res: any) => res.data),
    updateUnidade: (ucId: number, data: any) => axiosInstance.put(`/consumidores/unidades/${ucId}`, data).then((res: any) => res.data),
    deleteUnidade: (ucId: number) => axiosInstance.delete(`/consumidores/unidades/${ucId}`).then((res: any) => res.data),
  },

  vinculos: {
    list: () => axiosInstance.get('/vinculos').then((res: any) => res.data),
    get: (id: number) => axiosInstance.get(`/vinculos/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/vinculos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/vinculos/${id}`, data).then((res: any) => res.data),
    encerrar: (id: number, dataFim: string) => axiosInstance.put(`/vinculos/${id}/encerrar`, { data_fim: dataFim }).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/vinculos/${id}`).then((res: any) => res.data),
    
    // Auditorias
    getAuditorias: (id: number) => axiosInstance.get(`/vinculos/${id}/auditorias`).then((res: any) => res.data),
    createAuditoria: (id: number, data: any) => axiosInstance.post(`/vinculos/${id}/auditorias`, data).then((res: any) => res.data),
    updateAuditoria: (auditoriaId: number, data: any) => axiosInstance.put(`/vinculos/auditorias/${auditoriaId}`, data).then((res: any) => res.data),
    deleteAuditoria: (auditoriaId: number) => axiosInstance.delete(`/vinculos/auditorias/${auditoriaId}`).then((res: any) => res.data),
    
    // Rateio
    addUnidadeRateio: (id: number, data: { unidade_consumidora_id: number, percentual_rateio: number }) =>
      axiosInstance.post(`/vinculos/${id}/unidades`, data).then((res: any) => res.data),
    updateUnidadeRateio: (linkId: number, percentual: number) =>
      axiosInstance.put(`/vinculos/unidades_vinculadas/${linkId}`, { percentual_rateio: percentual }).then((res: any) => res.data),
    removeUnidadeRateio: (linkId: number) =>
      axiosInstance.delete(`/vinculos/unidades_vinculadas/${linkId}`).then((res: any) => res.data),
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
      const response = await axiosInstance.get(`/dashboard/resumo?mes=${mes}`);
      return response.data;
    },
    getHistorico: async (ano: string | number) => {
      const response = await axiosInstance.get(`/dashboard/historico?ano=${ano}`);
      return response.data;
    }
  },

  relatorios: {
    rentabilidade: (mes: string) => axiosInstance.get(`/relatorios/rentabilidade?mes=${mes}`).then((res: any) => res.data),
  },

  fechamentos: {
    list: (vinculoId: number) => axiosInstance.get(`/fechamentos/${vinculoId}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/fechamentos', data).then((res: any) => res.data),
    update: (id: number, data: any) => axiosInstance.put(`/fechamentos/${id}`, data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/fechamentos/${id}`).then((res: any) => res.data),
  },

  // --- CORREÇÃO AQUI (Renomeado para documentos) ---
  documentos: {
    list: (tipo: string, id: number) => axiosInstance.get(`/cpf_cnpjs/${tipo}/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/cpf_cnpjs', data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/cpf_cnpjs/${id}`).then((res: any) => res.data),
  },

  // Mantive 'cpf_cnpjs' como alias para compatibilidade com código antigo
  cpf_cnpjs: {
    list: (tipo: string, id: number) => axiosInstance.get(`/cpf_cnpjs/${tipo}/${id}`).then((res: any) => res.data),
    create: (data: any) => axiosInstance.post('/cpf_cnpjs', data).then((res: any) => res.data),
    delete: (id: number) => axiosInstance.delete(`/cpf_cnpjs/${id}`).then((res: any) => res.data),
  },

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
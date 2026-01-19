import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, Link as LinkIcon, FileText, ArrowRight, Zap, User, MapPin } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

interface Vinculo {
  vinculo_id: number;
  percentual: number;
  status: { descricao: string };
  usinas: { usina_id: number; nome_proprietario: string; tipo: string };
  consumidores: { consumidor_id: number; nome: string; cidade: string; uf: string };
}

export default function ListaVinculos() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const loadVinculos = () => {
    setLoading(true);
    api.vinculos.list()
      .then((data: any) => {
        setVinculos(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVinculos();
  }, []);

  const filtrados = vinculos.filter(v => 
    (v.usinas?.nome_proprietario || '').toLowerCase().includes(busca.toLowerCase()) ||
    (v.consumidores?.nome || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Contratos de Energia</h2>
          <p className="text-gray-500 mt-1">Gerencie os vínculos entre suas usinas e consumidores</p>
        </div>
        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-6 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Contrato</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* BARRA DE BUSCA */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por nome da usina ou cliente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* CONTEÚDO */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <LinkIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum contrato encontrado</h3>
            <p className="text-gray-500 max-w-sm mt-1">Crie um novo vínculo para começar a gerenciar a alocação de energia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID Contrato</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usina (Gerador)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Alocação</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente (Consumidor)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtrados.map((v) => (
                  <tr key={v.vinculo_id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* COLUNA ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/vinculos/${v.vinculo_id}`} className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-blue-600">#{v.vinculo_id}</span>
                      </Link>
                    </td>

                    {/* COLUNA USINA */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-yellow-100 text-yellow-700 rounded-md">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <Link 
                            to={`/usinas/${v.usinas?.usina_id}`} 
                            className="font-bold text-gray-900 hover:text-blue-600 hover:underline block"
                          >
                            {v.usinas?.nome_proprietario || 'N/D'}
                          </Link>
                          <span className="text-xs text-gray-500">{v.usinas?.tipo || '-'}</span>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA PERCENTUAL (SETA) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="flex items-center text-gray-300">
                          <div className="h-px w-8 bg-gray-300"></div>
                          <ArrowRight className="w-4 h-4" />
                          <div className="h-px w-8 bg-gray-300"></div>
                        </div>
                        <span className="text-sm font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-100 shadow-sm">
                          {v.percentual}%
                        </span>
                      </div>
                    </td>

                    {/* COLUNA CONSUMIDOR */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-blue-100 text-blue-700 rounded-md">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <Link 
                            to={`/consumidores/${v.consumidores?.consumidor_id}`} 
                            className="font-bold text-gray-900 hover:text-blue-600 hover:underline block"
                          >
                            {v.consumidores?.nome || 'N/D'}
                          </Link>
                          {v.consumidores?.cidade && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {v.consumidores.cidade}/{v.consumidores.uf}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* COLUNA STATUS */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        v.status?.descricao === 'Ativo' 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          v.status?.descricao === 'Ativo' ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}></span>
                        {v.status?.descricao || 'Desconhecido'}
                      </span>
                    </td>

                    {/* AÇÕES */}
                    <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`/vinculos/${v.vinculo_id}`}
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Abrir <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
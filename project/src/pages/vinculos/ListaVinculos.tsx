import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, 
  Search, 
  Zap, 
  User, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Link as LinkIcon
} from 'lucide-react';
import Skeleton from '../../components/Skeleton';

interface Vinculo {
  vinculo_id: number;
  percentual: number;
  data_inicio: string;
  status: { descricao: string };
  usinas: { usina_id: number; nome_proprietario: string; tipo: string };
  consumidores: { consumidor_id: number; nome: string; cidade: string; uf: string };
}

export default function ListaVinculos() {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // KPIs
  const [stats, setStats] = useState({ total: 0, ativos: 0, mediaPercentual: 0 });

  const loadVinculos = () => {
    setLoading(true);
    api.vinculos.list()
      .then((data: any) => {
        const lista = Array.isArray(data) ? data : [];
        setVinculos(lista);

        // Calcular KPIs
        const ativos = lista.filter(v => v.status?.descricao === 'Ativo').length;
        const somaPercentual = lista.reduce((acc, curr) => acc + (Number(curr.percentual) || 0), 0);
        
        setStats({
          total: lista.length,
          ativos: ativos,
          mediaPercentual: lista.length > 0 ? Math.round(somaPercentual / lista.length) : 0
        });
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
          <p className="text-gray-500 mt-1">Gerencie a alocação de créditos entre usinas e consumidores</p>
        </div>
        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-6 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </Link>
      </div>

      {/* CARDS DE KPI (RESUMO) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Contratos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Contratos Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{stats.ativos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Média de Alocação</p>
            <p className="text-2xl font-bold text-gray-900">{stats.mediaPercentual}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* BARRA DE BUSCA */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por usina ou consumidor..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* TABELA */}
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
            <p className="text-gray-500 max-w-sm mt-1">Crie um novo vínculo para começar a gerenciar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usina (Gerador)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Alocação</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente (Consumidor)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtrados.map((v) => {
                  const isAtivo = v.status?.descricao === 'Ativo';
                  const isInativo = v.status?.descricao === 'Encerrado' || v.status?.descricao === 'Inativo';
                  
                  return (
                    <tr key={v.vinculo_id} className="hover:bg-blue-50/30 transition-colors group">
                      
                      {/* COLUNA USINA */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-yellow-100 text-yellow-700 rounded-lg shadow-sm">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <Link 
                              to={`/usinas/${v.usinas?.usina_id}`} 
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline block text-base"
                            >
                              {v.usinas?.nome_proprietario || 'N/D'}
                            </Link>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">
                              {v.usinas?.tipo || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA PERCENTUAL (VISUAL) */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="text-lg font-black text-slate-700">
                            {v.percentual}%
                          </div>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${Math.min(v.percentual, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* COLUNA CONSUMIDOR */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-lg shadow-sm">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <Link 
                              to={`/consumidores/${v.consumidores?.consumidor_id}`} 
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline block text-base"
                            >
                              {v.consumidores?.nome || 'N/D'}
                            </Link>
                            {v.consumidores?.cidade && (
                              <div className="text-xs text-gray-500 mt-1">
                                {v.consumidores.cidade}/{v.consumidores.uf}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUNA STATUS (COLORIDA) */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${
                          isAtivo 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : isInativo
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {isAtivo && <CheckCircle className="w-3 h-3 mr-1.5" />}
                          {isInativo && <XCircle className="w-3 h-3 mr-1.5" />}
                          {!isAtivo && !isInativo && <AlertCircle className="w-3 h-3 mr-1.5" />}
                          {v.status?.descricao || 'Desconhecido'}
                        </span>
                      </td>

                      {/* AÇÕES */}
                      <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                        <Link 
                          to={`/vinculos/${v.vinculo_id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"
                        >
                          Detalhes <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
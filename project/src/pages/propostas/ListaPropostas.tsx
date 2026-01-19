import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, FileText, Calendar, User, ArrowRight } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

// Interface ajustada ao seu banco (snake_case)
interface Proposta {
  id: number;
  nome_cliente_prospect: string;
  status: string;
  created_at: string;
  dados_simulacao: any;
}

export default function ListaPropostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const loadPropostas = () => {
    setLoading(true);
    api.propostas.list()
      .then((data: any) => {
        setPropostas(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPropostas();
  }, []);

  const filtrados = propostas.filter(p => 
    (p.nome_cliente_prospect || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Simulações</h2>
          <p className="text-gray-500 mt-1">Histórico de propostas geradas</p>
        </div>
        {/* BOTÃO CORRIGIDO: Aponta para /propostas/novo */}
        <Link
          to="/propostas/novo"
          className="flex items-center gap-2 px-6 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Simulação</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* BUSCA */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por nome do cliente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <p>Nenhuma simulação encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900">{p.nome_cliente_prospect}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                        {p.status || 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* LINK CORRIGIDO: Aponta para /propostas/ID */}
                      <Link 
                        to={`/propostas/${p.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
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
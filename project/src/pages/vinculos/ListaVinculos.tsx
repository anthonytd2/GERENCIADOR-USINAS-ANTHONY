import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, Link as LinkIcon, FileText, ArrowRight } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

interface Vinculo {
  vinculo_id: number;
  percentual: number;
  status: { descricao: string };
  usinas: { nome_proprietario: string };
  consumidores: { nome: string };
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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Vínculos</h2>
          <p className="text-gray-500 mt-1">Gestão de contratos e alocações</p>
        </div>
        <Link
          to="/vinculos/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Vínculo</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Buscar por usina ou consumidor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-DEFAULT focus:border-transparent"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum vínculo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Usina</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Vínculo</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Consumidor</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((v) => (
                  <tr key={v.vinculo_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {v.usinas?.nome_proprietario || 'Usina N/D'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <ArrowRight className="w-4 h-4" />
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">
                          {v.percentual}%
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {v.consumidores?.nome || 'Consumidor N/D'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        v.status?.descricao === 'Ativo' 
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {v.status?.descricao || 'Desconhecido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/vinculos/${v.vinculo_id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        Detalhes
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
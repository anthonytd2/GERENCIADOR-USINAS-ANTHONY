import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, Search, Percent, DollarSign, Zap, MessageCircle } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  MediaConsumo: number;
  PercentualDesconto: number;
  TipoDesconto?: string;
  Vendedor?: string;
  Telefone?: string; // Assume que o banco retorna isso (select *)
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const loadConsumidores = () => {
    setLoading(true);
    api.consumidores.list()
      .then((data: any) => {
        const lista = Array.isArray(data) ? data : (data.data || []);
        setConsumidores(lista);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConsumidores();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este consumidor?')) return;
    await api.consumidores.delete(id);
    loadConsumidores();
  };

  const handleWhatsapp = (telefone: string | undefined, nome: string) => {
    if (!telefone) return alert('Telefone não cadastrado');
    // Remove caracteres não numéricos
    const num = telefone.replace(/\D/g, '');
    const msg = `Olá ${nome}, tudo bem? Entro em contato referente à sua energia solar.`;
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const consumidoresFiltrados = consumidores.filter(c => 
    c.Nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Consumidores</h2>
          <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes</p>
        </div>
        <Link
          to="/consumidores/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Consumidor</span>
        </Link>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome..."
          className="pl-10 w-full md:w-1/3 rounded-lg border-gray-300 focus:ring-brand-DEFAULT focus:border-brand-DEFAULT py-2 shadow-sm"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
           <div className="p-6 space-y-4">
             {[1,2,3].map(i => <div key={i} className="flex justify-between"><div className="flex gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-48" /></div><Skeleton className="h-8 w-20" /></div>)}
           </div>
        ) : consumidoresFiltrados.length === 0 ? (
          <div className="p-10 text-center text-gray-500">Nenhum consumidor encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Média Consumo</th>
                  <th className="px-6 text-left py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cobrança</th>
                  <th className="px-6 text-center py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 text-right py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {consumidoresFiltrados.map((c) => (
                  <tr key={c.ConsumidorID} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/consumidores/${c.ConsumidorID}/editar`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-200 transition-colors">
                          {c.Nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {c.Nome}
                          </div>
                          <div className="text-xs text-gray-500">ID: {c.ConsumidorID}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{c.MediaConsumo.toLocaleString('pt-BR')} kWh</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.TipoDesconto === 'valor_fixo' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <DollarSign className="w-3 h-3" />
                          {formatMoeda(Number(c.PercentualDesconto))} / kWh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Percent className="w-3 h-3" />
                          {c.PercentualDesconto}% Desc.
                        </span>
                      )}
                    </td>

                    {/* COLUNA WHATSAPP */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleWhatsapp(c.Telefone, c.Nome)}
                        className="p-2 bg-green-100 text-green-600 hover:bg-green-500 hover:text-white rounded-full transition-all duration-300"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/consumidores/${c.ConsumidorID}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button onClick={() => handleDelete(c.ConsumidorID)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
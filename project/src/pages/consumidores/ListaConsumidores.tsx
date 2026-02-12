import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Search, Edit, Trash2, MapPin, Zap, User, ArrowRight, Wallet } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';

interface Consumidor {
  consumidor_id: number;
  nome: string;
  cidade: string;
  uf: string;
  media_consumo: number;
  status?: string;
  cpf_cnpj?: string; // CPF/CNPJ opcional
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Controle de Modal de Exclusão
  const [modalAberto, setModalAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const loadConsumidores = () => {
    setLoading(true);
    api.consumidores.list()
      .then((data: any) => {
        setConsumidores(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadConsumidores();
  }, []);

  // --- Lógica de Exclusão ---
  const solicitarExclusao = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); // Evita navegar ao clicar na lixeira
    e.stopPropagation();
    setIdParaExcluir(id);
    setModalAberto(true);
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await api.consumidores.delete(idParaExcluir);
      toast.success('Consumidor excluído com sucesso!');
      loadConsumidores();
    } catch (error) {
      toast.error('Não foi possível excluir. Verifique se existem vínculos ativos.');
    } finally {
      setModalAberto(false);
      setIdParaExcluir(null);
    }
  };

  // Filtro de Busca
  const filtrados = consumidores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cidade && c.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in-down pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-blue-600 fill-blue-600" />
            Consumidores
          </h1>
          <p className="text-gray-500 mt-1">Gerencie os consumidores que recebem créditos.</p>
        </div>

        {/* BOTÃO NOVO CONSUMIDOR */}
        <Link
          to="/consumidores/novo"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Consumidor</span>
        </Link>
      </div>

      {/* BARRA DE BUSCA E FILTROS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar Consumidor"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none font-medium"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-400 font-medium hidden md:block px-2">
          {filtrados.length} {filtrados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
        </div>
      </div>

      {/* LISTA DE CARDS (VISUAL MODERNO) */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Nenhum consumidor encontrado</h3>
          <p className="text-gray-500 max-w-xs mt-2">Tente buscar por outro termo ou cadastre um novo cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtrados.map((c) => (
            <Link 
              to={`/consumidores/${c.consumidor_id}`} 
              key={c.consumidor_id}
              className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row items-center gap-6 relative overflow-hidden"
            >
              {/* Faixa lateral decorativa (Azul) */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 group-hover:bg-blue-600 transition-colors"></div>

              {/* AVATAR COM INICIAL */}
              <div className="flex-shrink-0 pl-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-100">
                  {c.nome.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* DADOS DO CLIENTE */}
              <div className="flex-1 text-center md:text-left min-w-[200px]">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {c.nome}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 text-sm text-gray-500">
                  {c.cidade && (
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {c.cidade}/{c.uf}
                    </span>
                  )}
                  {c.cpf_cnpj && (
                    <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
                       <Wallet className="w-3 h-3" />
                       {c.cpf_cnpj}
                    </span>
                  )}
                </div>
              </div>

              {/* CONSUMO E INFO FINANCEIRA */}
              <div className="flex flex-col items-center md:items-end min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Média Consumo</span>
                <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xl">
                  <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {c.media_consumo?.toLocaleString('pt-BR')} <span className="text-xs text-gray-400 font-normal mt-1">kWh</span>
                </div>
              </div>

              {/* AÇÕES RÁPIDAS (Sempre Visíveis) */}
              <div className="flex items-center gap-2 border-l pl-4 ml-4 border-gray-100">
                 <button 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/consumidores/${c.consumidor_id}/editar`;
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => solicitarExclusao(c.consumidor_id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                {/* Seta para entrar no detalhe */}
                <div className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal de Confirmação */}
      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Consumidor"
        message="Tem certeza absoluta? Essa ação não pode ser desfeita e removerá o histórico deste cliente se não houver vínculos."
        isDestructive={true}
        confirmText="Sim, Excluir Definitivamente"
      />
    </div>
  );
}
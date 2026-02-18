import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { 
  Plus, Search, Edit, Trash2, MapPin, Zap, User, ArrowRight, Wallet 
} from 'lucide-react';
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
  cpf_cnpj?: string;
}

export default function ListaConsumidores() {
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
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

  const solicitarExclusao = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
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
      toast.error('Não foi possível excluir. Verifique vínculos ativos.');
    } finally {
      setModalAberto(false);
      setIdParaExcluir(null);
    }
  };

  const filtrados = consumidores.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cidade && c.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in-down pb-20">
      
      {/* 1. CABEÇALHO COM MAIS PRESENÇA VISUAL */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-blue-100 pb-6">
        <div className="flex items-center gap-4">
          {/* Ícone de destaque com fundo colorido */}
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-200">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Carteira de Consumidores
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Gerencie os beneficiários dos créditos de energia.
            </p>
          </div>
        </div>

        <Link
          to="/consumidores/novo"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-[0px]"
        >
          <Plus className="w-5 h-5" />
          Novo Consumidor
        </Link>
      </div>

      {/* 2. BARRA DE BUSCA MAIS MODERNA */}
      <div className="bg-white p-2 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-blue-50/30 transition-all">
        <div className="p-2 text-blue-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome, cidade ou documento..."
          className="flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none h-10"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <div className="hidden md:block pr-4 border-l border-blue-100 pl-4 text-xs font-bold text-blue-400 uppercase">
          {filtrados.length} Registros
        </div>
      </div>

      {/* 3. LISTA DE CARDS VIBRANTES */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-blue-200 text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-gray-900 font-bold mb-1">Nenhum consumidor encontrado</h3>
          <p className="text-gray-500 text-sm">Verifique o termo buscado ou cadastre um novo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtrados.map((c) => (
            <Link 
              to={`/consumidores/${c.consumidor_id}`} 
              key={c.consumidor_id}
              // Mudança aqui: hover com fundo sutil colorido
              className="group bg-white p-0 rounded-2xl border border-blue-50 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col md:flex-row items-stretch overflow-hidden relative"
            >
              {/* Faixa lateral: Agora é um gradiente */}
              <div className="w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 transition-colors"></div>

              <div className="flex-1 p-5 flex flex-col md:flex-row items-center gap-6">
                
                {/* AVATAR: Mais vibrante com gradiente */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-blue-200">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* INFO PRINCIPAL */}
                <div className="flex-1 text-center md:text-left min-w-[200px]">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {c.nome}
                  </h3>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-2">
                    {c.cidade && (
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {c.cidade}/{c.uf}
                      </span>
                    )}
                    {c.cpf_cnpj && (
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md font-mono">
                        <Wallet className="w-3 h-3 text-gray-400" />
                        {c.cpf_cnpj}
                      </span>
                    )}
                  </div>
                </div>

                {/* CONSUMO: Badge mais "ensolarado" */}
                <div className="flex flex-col items-center md:items-end w-full md:w-auto border-t md:border-t-0 md:border-l border-blue-50 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Média Mensal</span>
                  {/* Cores mais vivas aqui */}
                  <div className="flex items-center gap-1.5 bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-200 shadow-sm shadow-yellow-100">
                    <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-base font-bold text-yellow-800">
                      {c.media_consumo?.toLocaleString('pt-BR')} kWh
                    </span>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex items-center gap-1 md:ml-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/consumidores/${c.consumidor_id}/editar`;
                    }}
                    // Botões com cores no hover
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => solicitarExclusao(c.consumidor_id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}

      <ModalConfirmacao
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onConfirm={confirmarExclusao}
        title="Excluir Consumidor"
        message="Tem certeza absoluta? Essa ação não pode ser desfeita."
        isDestructive={true}
        confirmText="Excluir"
      />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Filter } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast'; // Para as mensagens bonitas
import ModalConfirmacao from '../../components/ModalConfirmacao'; // Para a janela de confirmação
import { Usina } from '../../types'; // <--- Adicione isso



export default function ListaUsinas() {
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'disponiveis' | 'locadas'>('todos');
  // Estados para controlar o Modal
  const [modalAberto, setModalAberto] = useState(false); // Começa fechado (false)
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null); // Nenhuma usina selecionada ainda
  const loadUsinas = () => {
    setLoading(true);
    api.usinas.list()
      .then((data: any) => {
        // O backend agora já manda os dados limpos e formatados
        // Não precisamos mais de adaptadores complexos
        const lista = Array.isArray(data) ? data : [];
        setUsinas(lista);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsinas();
  }, []);
  // Função 1: Apenas abre a janela (não deleta nada ainda)
  const solicitarExclusao = (id: number) => {
    setIdParaExcluir(id); // Guarda qual usina é
    setModalAberto(true); // Abre a janela
  };

  // Função 2: Ocorre QUANDO clica em "Sim" no Modal
  const confirmarExclusao = async () => {
    if (!idParaExcluir) return; // Segurança extra

    try {
      await api.usinas.delete(idParaExcluir); // Deleta de verdade no banco
      toast.success('Usina excluída com sucesso!'); // Feedback visual verde
      loadUsinas(); // Atualiza a lista na tela
    } catch (error) {
      toast.error('Erro ao excluir usina.'); // Feedback visual vermelho
    } finally {
      setModalAberto(false); // Fecha a janela
      setIdParaExcluir(null); // Limpa a memória
    }
  };

  const formatMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const usinasFiltradas = usinas.filter(u => {
    if (filtro === 'disponiveis') return !u.is_locada;
    if (filtro === 'locadas') return u.is_locada;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Usinas</h2>
          <p className="text-gray-500 mt-1">Gerencie suas unidades geradoras</p>
        </div>
        <Link
          to="/usinas/novo"
          className="flex items-center gap-2 px-5 py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Usina</span>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>Todas</button>
        <button onClick={() => setFiltro('disponiveis')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'disponiveis' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white text-gray-600 border border-gray-200'}`}><XCircle className="w-4 h-4" /> Disponíveis</button>
        <button onClick={() => setFiltro('locadas')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === 'locadas' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-white text-gray-600 border border-gray-200'}`}><CheckCircle className="w-4 h-4" /> Locadas</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando...</div>
        ) : usinasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nenhuma usina encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Proprietário</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Potência</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Geração Est.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Valor kW</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usinasFiltradas.map((u) => (
                  <tr key={u.usina_id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/usinas/${u.usina_id}`} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold">
                          {(u.nome_proprietario || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600">{u.nome_proprietario}</div>
                          <div className="text-xs text-gray-500">{u.tipo}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.potencia} kWp</td>
                    <td className="px-6 py-4 text-gray-600">{u.geracao_estimada.toLocaleString('pt-BR')} kWh</td>
                    <td className="px-6 py-4 font-medium text-emerald-700 bg-emerald-50/30">{formatMoeda(u.valor_kw_bruto || 0)}</td>
                    <td className="px-6 py-4 text-center">
                      {u.is_locada ? <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Locada</span> : <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">Disponível</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/usinas/${u.usina_id}/editar`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><Edit className="w-5 h-5" /></Link>
                        <button onClick={() => solicitarExclusao(u.usina_id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Componente Visual do Modal */}
      <ModalConfirmacao
        isOpen={modalAberto} // Liga/Desliga baseado no estado
        onClose={() => setModalAberto(false)} // Se clicar em cancelar, fecha
        onConfirm={confirmarExclusao} // Se clicar em Sim, chama a função de deletar
        title="Excluir Usina"
        message="Tem certeza que deseja excluir esta usina? Todos os dados vinculados a ela poderão ser afetados."
        isDestructive={true} // Deixa o botão vermelho (perigo)
        confirmText="Sim, Excluir"
      />
    </div> // <--- AQUI É A DIV QUE JÁ EXISTIA
  );
}
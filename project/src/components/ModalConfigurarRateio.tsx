import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Save, Percent } from 'lucide-react';
import { UnidadeVinculada } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vinculoId: number;
  consumidorId: number;
  onSuccess: () => void;
}

export default function ModalConfigurarRateio({ isOpen, onClose, vinculoId, consumidorId, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [vinculadas, setVinculadas] = useState<UnidadeVinculada[]>([]);
  const [disponiveis, setDisponiveis] = useState<any[]>([]);

  const [selectedUcId, setSelectedUcId] = useState('');
  const [percentual, setPercentual] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Busca o Vínculo
      const vinculoData = await api.vinculos.get(vinculoId);
      
      // --- CORREÇÃO AQUI ---
      // Filtramos para pegar APENAS as que tem ID real (diferente de 0).
      // Isso ignora o "Fallback Inteligente" do backend e resolve o erro de chave duplicada.
      const listaVinculadasReais = (vinculoData.unidades_vinculadas || []).filter((v: any) => v.id !== 0);
      
      setVinculadas(listaVinculadasReais);

      // 2. Busca todas as UCs do Consumidor
      const todasUcs = await api.consumidores.getUnidades(consumidorId);
      
      // 3. Filtra: Dropdown mostra apenas quem NÃO está na lista de reais
      const idsJaVinculados = listaVinculadasReais.map((v: any) => v.unidade_consumidora_id);
      const livres = todasUcs.filter((uc: any) => !idsJaVinculados.includes(uc.id));
      
      setDisponiveis(livres);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar unidades.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUcId || !percentual) return;

    try {
      await api.vinculos.addUnidadeRateio(vinculoId, {
        unidade_consumidora_id: Number(selectedUcId),
        percentual_rateio: Number(percentual)
      });
      
      toast.success('Adicionado!');
      setPercentual('');
      setSelectedUcId('');
      loadData(); 
    } catch (error) {
      toast.error('Erro ao adicionar.');
    }
  };

  const handleUpdate = async (linkId: number, novoValor: string) => {
    // Proteção extra: não tenta atualizar ID 0
    if (!linkId || linkId === 0) return; 

    try {
        await api.vinculos.updateUnidadeRateio(linkId, Number(novoValor));
        toast.success('Atualizado');
        // Não recarregamos tudo para não perder o foco do input
    } catch (error) {
        toast.error('Erro ao atualizar');
    }
  };

  const handleRemove = async (linkId: number) => {
    if (!confirm('Remover esta unidade do rateio?')) return;
    try {
      await api.vinculos.removeUnidadeRateio(linkId);
      toast.success('Removido.');
      loadData();
    } catch (error) {
      toast.error('Erro ao remover.');
    }
  };

  const totalPercentual = vinculadas.reduce((acc, curr) => acc + Number(curr.percentual_rateio || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-400" /> Configurar Rateio
            </h3>
            <p className="text-slate-400 text-sm">Distribua os créditos entre as unidades do cliente.</p>
          </div>
          <button onClick={() => { onSuccess(); onClose(); }} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
          
          {/* BARRA DE TOTAL */}
          <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
             <div className="text-sm font-bold text-gray-500 uppercase">Total Distribuído</div>
             <div className={`text-2xl font-black ${totalPercentual > 100 ? 'text-red-500' : totalPercentual === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {totalPercentual}%
             </div>
          </div>

          {/* LISTA DE VINCULADAS (EDITÁVEL) */}
          <div className="space-y-3 mb-8">
            <label className="text-xs font-bold text-gray-400 uppercase">Unidades no Contrato</label>
            
            {loading ? (
                <div className="text-center py-4 text-gray-400">Carregando...</div>
            ) : vinculadas.length === 0 ? (
                <p className="text-center py-4 text-gray-400 italic bg-white rounded-lg border border-dashed">Nenhuma unidade configurada.</p>
            ) : (
                vinculadas.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">UC {item.unidades_consumidoras.codigo_uc}</p>
                            <p className="text-xs text-gray-500 truncate">{item.unidades_consumidoras.endereco}</p>
                        </div>
                        
                        {/* INPUT DE PORCENTAGEM INLINE */}
                        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <input 
                                type="number" 
                                className="w-14 bg-transparent text-right font-bold text-gray-800 outline-none"
                                defaultValue={item.percentual_rateio}
                                onBlur={(e) => handleUpdate(item.id, e.target.value)}
                            />
                            <span className="text-xs font-bold text-gray-400 pr-2">%</span>
                        </div>

                        <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))
            )}
          </div>

          {/* FORM DE ADICIONAR */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
             <h4 className="font-bold text-blue-800 mb-3 text-sm flex items-center gap-2">
                <Plus size={16}/> Adicionar Unidade
             </h4>
             <form onSubmit={handleAdd} className="flex gap-3">
                <div className="flex-1">
                    <select 
                        required
                        className="w-full p-3 rounded-xl border border-blue-200 text-sm outline-none focus:border-blue-500 bg-white"
                        value={selectedUcId}
                        onChange={e => setSelectedUcId(e.target.value)}
                    >
                        <option value="">Selecione uma UC...</option>
                        {disponiveis.map(uc => (
                            <option key={uc.id} value={uc.id}>
                                {uc.codigo_uc} - {uc.endereco}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="w-24 relative">
                    <input 
                        type="number" 
                        required
                        placeholder="%"
                        className="w-full p-3 rounded-xl border border-blue-200 text-sm outline-none focus:border-blue-500 text-center font-bold"
                        value={percentual}
                        onChange={e => setPercentual(e.target.value)}
                    />
                </div>
                <button type="submit" className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm">
                    <Save size={20} />
                </button>
             </form>
             {disponiveis.length === 0 && !loading && (
                <p className="text-xs text-blue-400 mt-2 ml-1">
                   * Todas as UCs deste cliente já estão vinculadas.
                </p>
             )}
          </div>

        </div>
        
        <div className="p-4 bg-gray-100 text-center">
            <button onClick={() => { onSuccess(); onClose(); }} className="px-8 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-200">
                Concluir Configuração
            </button>
        </div>
      </div>
    </div>
  );
}
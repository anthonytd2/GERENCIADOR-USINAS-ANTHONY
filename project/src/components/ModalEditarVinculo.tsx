import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { X, Save, Activity, FileText } from 'lucide-react';

interface ModalEditarVinculoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Para recarregar a tela de trás
  vinculo: {
    id: number;           // CORREÇÃO: id
    status_id?: number;
    observacao?: string;  // CORREÇÃO: observacao (singular)
  };
}

interface EditForm {
  status_id: number;
  observacao: string;     // CORREÇÃO: observacao
}

export default function ModalEditarVinculo({ isOpen, onClose, onSuccess, vinculo }: ModalEditarVinculoProps) {
  const { register, handleSubmit, setValue } = useForm<EditForm>();
  const [loading, setLoading] = useState(false);
  const [listaStatus, setListaStatus] = useState<any[]>([]);

  // 1. Ao abrir, carrega a lista de status e preenche os dados atuais
  useEffect(() => {
    if (isOpen) {
      // Busca lista de status do banco
      api.status.list()
        .then((data: any) => setListaStatus(data || []))
        .catch(() => toast.error('Erro ao carregar status.'));
        
      // Preenche o formulário com o que já existe
      if (vinculo.status_id) setValue('status_id', vinculo.status_id);
      
      // CORREÇÃO: observacao
      if (vinculo.observacao) setValue('observacao', vinculo.observacao);
    }
  }, [isOpen, vinculo, setValue]);

  const onSubmit = async (data: EditForm) => {
    setLoading(true);
    try {
      // Envia a atualização para o backend
      // CORREÇÃO: id e observacao
      await api.vinculos.update(vinculo.id, {
        status_id: Number(data.status_id),
        observacao: data.observacao
      });

      toast.success('Vínculo atualizado com sucesso!');
      onSuccess(); // Avisa a tela pai para recarregar
      onClose();   // Fecha o modal
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar vínculo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-50-card rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Cabeçalho */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          {/* CORREÇÃO: Exibe id */}
          <h3 className="font-bold text-lg text-gray-900">Editar Vínculo #{vinculo.id}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          
          {/* Campo Status */}
          <div>
            <label className="block text-sm  text-gray-700 mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Alterar Status
            </label>
            <select
              {...register('status_id', { required: true })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50-card transition-all"
            >
              {listaStatus.map(s => (
                <option key={s.status_id} value={s.status_id}>
                  {s.descricao}
                </option>
              ))}
            </select>
          </div>

          {/* Campo Observações */}
          <div>
            <label className="block text-sm  text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" /> Notas / Observações
            </label>
            <textarea
              {...register('observacao')} // CORREÇÃO: observacao
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
              placeholder="Ex: Protocolo Copel, motivo da pendência, etc..."
            />
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex justify-center items-center gap-2 transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

        </form>
      </div>
    </div>
  );
}
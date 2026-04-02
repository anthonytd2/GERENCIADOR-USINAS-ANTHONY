import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, FileText, Activity } from 'lucide-react';


interface VinculoFormInput {
  usina_id: string | number;
  consumidor_id: string | number;
  percentual: string | number;
  data_inicio: string;
  data_fim?: string;
  status_id: string | number;
  observacoes?: string;
}

export default function FormularioVinculo() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<VinculoFormInput>(); 
  const [usinas, setUsinas] = useState<any[]>([]);
  const [consumidores, setConsumidores] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [uData, cData, sData] = await Promise.all([
          api.usinas.list(),
          api.consumidores.list(),
          api.status.list()
        ]);

        setUsinas(Array.isArray(uData) ? uData : []);
        setConsumidores(Array.isArray(cData) ? cData : []);
        setStatusList(Array.isArray(sData) ? sData : []);

if (id) {
          const vinculo = await api.vinculos.get(Number(id));
          if (vinculo) {
            reset({
              usina_id: vinculo.usina_id,
              consumidor_id: vinculo.consumidor_id,
              percentual: vinculo.percentual,
              status_id: vinculo.status_id,
              data_inicio: vinculo.data_inicio ? vinculo.data_inicio.split('T')[0] : '',
              data_fim: vinculo.data_fim ? vinculo.data_fim.split('T')[0] : '',
              observacoes: vinculo.observacao || vinculo.observacoes
            });
          }
        } else {
          // 🟢 INTELIGÊNCIA NOVA AQUI: Lendo a URL vinda do Mapa de Alocações
          const urlUsina = searchParams.get('usina');
          const urlConsumidor = searchParams.get('consumidor');
          
          if (urlUsina) setValue('usina_id', urlUsina);
          if (urlConsumidor) setValue('consumidor_id', urlConsumidor);
          
          // Opcional: Já preenche a Data de Início com o dia de hoje para poupar tempo
          setValue('data_inicio', new Date().toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar dados do sistema.');
      }
    }
    loadData();
  }, [id, reset]);

  const onSubmit = async (data: VinculoFormInput) => {
    setLoading(true);
    const toastId = toast.loading(id ? 'Atualizando vínculo...' : 'Criando vínculo...');

    try {
      if (Number(data.percentual) > 100) {
        throw new Error('O percentual não pode ser maior que 100%.');
      }

      const payload = {
        usina_id: Number(data.usina_id),
        consumidor_id: Number(data.consumidor_id),
        percentual: Number(data.percentual),
        data_inicio: data.data_inicio,
        data_fim: data.data_fim || null,
        status_id: Number(data.status_id) || 1,
        observacao: data.observacoes || null
      };

      if (id) {
        await api.vinculos.update(Number(id), payload);
        toast.success('Vínculo atualizado com sucesso!', { id: toastId });
      } else {
        await api.vinculos.create(payload);
        toast.success('Vínculo criado com sucesso!', { id: toastId });
      }

      setTimeout(() => {
        navigate('/vinculos');
      }, 1000);

    } catch (error: any) {
      console.error("Erro no envio:", error);
      
      // 🟢 CORREÇÃO DA CAPTURA DE MENSAGEM: Pega o "error" exato do backend
      const msgBackend = error.response?.data?.error;
      
      if (msgBackend) {
        toast.error(msgBackend, { id: toastId });
      } else if (error.message) {
        toast.error(error.message, { id: toastId });
      } else {
        toast.error('Erro ao salvar vínculo. Tente novamente.', { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-down">
      <div className="mb-8">
        <Link to="/vinculos" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{id ? 'Editar Vínculo' : 'Novo Vínculo'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">

        <div>
          <label className="block text-sm text-gray-700 mb-1">Selecione a Usina</label>
          <select
            {...register('usina_id', { required: true })}
            disabled={!!id} 
            className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${id ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            <option value="">Selecione...</option>
            {usinas.map(u => {
              const idReal = u.id || u.usina_id;
              const nomeReal = u.nome || u.nome_proprietario;
              return (
                <option key={idReal} value={idReal}>
                  {nomeReal} ({u.potencia} kWp)
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Selecione o Consumidor</label>
          <select
            {...register('consumidor_id', { required: true })}
            disabled={!!id} 
            className={`w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${id ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            <option value="">Selecione...</option>
            {consumidores.map(c => {
               const idReal = c.id || c.consumidor_id;
               return (
                <option key={idReal} value={idReal}>
                  {c.nome}
                </option>
               );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Status do Contrato
          </label>
          <select
            {...register('status_id')}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          >
            {statusList.map(s => (
              <option key={s.id || s.status_id} value={s.id || s.status_id}>
                {s.descricao}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" /> Observações (Opcional)
          </label>
          <textarea
            {...register('observacoes')}
            placeholder="Ex: Protocolo Copel nº 123456... Aguardando vistoria..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Percentual (%)</label>
            <input
              type="number"
              defaultValue={100}
              {...register('percentual', { required: true, min: 0, max: 100 })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Início da Injeção</label>
            <input
              type="date"
              {...register('data_inicio', { required: true })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Fim (Opcional)</label>
            <input
              type="date"
              {...register('data_fim')}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isSubmitting} 
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm transition-all flex justify-center items-center gap-2 hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {loading || isSubmitting ? 'Salvando...' : (id ? 'Atualizar Vínculo' : 'Criar Vínculo')}
        </button>
      </form>
    </div>
  );
}
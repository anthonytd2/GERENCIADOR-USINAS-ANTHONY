import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FormularioConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

useEffect(() => {
    if (id && id !== 'novo') {
      // Opcional: Mostra que está a carregar
      const toastId = toast.loading('Carregando dados...');

      api.consumidores.get(Number(id))
        .then(data => {
          if (data) {
            setValue('nome', data.nome);
            setValue('documento', data.documento);
            setValue('cep', data.cep);
            setValue('endereco', data.endereco);
            setValue('bairro', data.bairro);
            setValue('cidade', data.cidade);
            setValue('uf', data.uf);
            setValue('media_consumo', data.media_consumo);
            setValue('valor_kw', data.valor_kw);
            setValue('percentual_desconto', data.percentual_desconto);
            setValue('observacao', data.observacao);
            
            // Remove o aviso de carregando se deu certo
            toast.dismiss(toastId);
          }
        }) // <--- FECHA O .then AQUI
        .catch(() => {
          // O .catch fica AQUI FORA
          toast.error('Erro ao carregar dados do consumidor.', { id: toastId });
        });
    }
  }, [id, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    // 1. Feedback imediato (Carregando)
    const toastId = toast.loading('Salvando consumidor...');

    try {
      // Conversão segura de números
      const payload = {
        ...data,
        media_consumo: Number(data.media_consumo) || 0,
        valor_kw: Number(data.valor_kw) || 0,
        percentual_desconto: Number(data.percentual_desconto) || 0,
      };

      if (id && id !== 'novo') {
        await api.consumidores.update(Number(id), payload);
        // 2. Sucesso na Edição
        toast.success('Consumidor atualizado com sucesso!', { id: toastId });
      } else {
        await api.consumidores.create(payload);
        // 3. Sucesso na Criação
        toast.success('Consumidor criado com sucesso!', { id: toastId });
      }

      // 4. Espera um pouquinho para o usuário ler antes de sair
      setTimeout(() => {
        navigate('/consumidores');
      }, 1000);

    } catch (error) {
      console.error(error);
      // 5. Erro
      toast.error('Erro ao salvar consumidor. Verifique os dados.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {id ? 'Editar Consumidor' : 'Novo Consumidor'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">

        {/* DADOS PESSOAIS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dados Pessoais</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input
              {...register('nome', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && <span className="text-red-500 text-sm">Obrigatório</span>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
            <input
              {...register('documento')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-2">Endereço</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input {...register('cep')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input {...register('bairro')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
            <input {...register('endereco')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input {...register('cidade')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <input {...register('uf')} maxLength={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase" />
            </div>
          </div>
        </div>

        {/* DADOS COMERCIAIS */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-2">Dados Comerciais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Média Consumo (kWh)</label>
              <input type="number" step="0.01" {...register('media_consumo')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor kW (R$)</label>
              <input type="number" step="0.01" {...register('valor_kw')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
            <input type="number" step="0.01" {...register('percentual_desconto')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('observacao')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark font-bold shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Consumidor'}
        </button>
      </form>
    </div>
  );
}
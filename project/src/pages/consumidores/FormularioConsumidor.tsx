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

  // Estado para controlar qual campo aparece (Desconto ou Valor Fixo)
  const [tipoCobranca, setTipoCobranca] = useState<'desconto' | 'fixo'>('desconto');

  useEffect(() => {
    if (id && id !== 'novo') {
      const toastId = toast.loading('Carregando dados...');

      api.consumidores.get(Number(id))
        .then(data => {
          if (data) {
            setValue('nome', data.nome);
            // O banco usa 'documento', mas o front antigo podia usar cpf_cnpj.
            // Aqui garantimos que o campo do formulário receba o valor correto.
            setValue('documento', data.documento || data.cpf_cnpj); 
            setValue('email', data.email);       // NOVO
            setValue('telefone', data.telefone); // NOVO
            setValue('cep', data.cep);
            setValue('endereco', data.endereco);
            setValue('bairro', data.bairro);
            setValue('cidade', data.cidade);
            setValue('uf', data.uf);
            setValue('media_consumo', data.media_consumo);
            setValue('valor_kw', data.valor_kw);
            setValue('percentual_desconto', data.percentual_desconto);
            setValue('observacao', data.observacao);

            // Lógica para definir o tipo de cobrança visual
            if (Number(data.valor_kw) > 0 && Number(data.percentual_desconto) === 0) {
              setTipoCobranca('fixo');
            } else {
              setTipoCobranca('desconto');
            }

            toast.dismiss(toastId);
          }
        })
        .catch(() => {
          toast.error('Erro ao carregar dados do consumidor.', { id: toastId });
        });
    }
  }, [id, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    const toastId = toast.loading('Salvando consumidor...');

    try {
      // Lógica de limpeza dos dados financeiros
      let valorFinalKw = 0;
      let valorFinalDesconto = 0;

      if (tipoCobranca === 'fixo') {
        valorFinalKw = Number(data.valor_kw) || 0;
        valorFinalDesconto = 0;
      } else {
        valorFinalKw = 0;
        valorFinalDesconto = Number(data.percentual_desconto) || 0;
      }

      const payload = {
        ...data,
        media_consumo: Number(data.media_consumo) || 0,
        valor_kw: valorFinalKw,
        percentual_desconto: valorFinalDesconto,
      };

      if (id && id !== 'novo') {
        await api.consumidores.update(Number(id), payload);
        toast.success('Consumidor atualizado com sucesso!', { id: toastId });
      } else {
        await api.consumidores.create(payload);
        toast.success('Consumidor criado com sucesso!', { id: toastId });
      }

      setTimeout(() => {
        navigate('/consumidores');
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar consumidor.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-down">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo (Titular)</label>
            <input
              {...register('nome', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.nome && <span className="text-red-500 text-sm">Obrigatório</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
              <input
                {...register('documento')} // Alterado para 'documento' para bater com o banco
                placeholder="000.000.000-00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input
                {...register('telefone')}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              {...register('email')}
              type="email"
              placeholder="cliente@email.com"
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
              <input
                type="number"
                step="0.01"
                {...register('media_consumo')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Cobrança</label>
              <select
                value={tipoCobranca}
                onChange={(e) => {
                  setTipoCobranca(e.target.value as 'desconto' | 'fixo');
                  if (e.target.value === 'desconto') setValue('valor_kw', '');
                  else setValue('percentual_desconto', '');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors"
              >
                <option value="desconto">Aplicar Desconto (%)</option>
                <option value="fixo">Valor Fixo do kWh (R$)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            {tipoCobranca === 'desconto' ? (
              <div>
                <label className="block text-sm font-bold text-blue-700 mb-1">Percentual de Desconto Garantido (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 15"
                    {...register('percentual_desconto')}
                    className="w-full pl-4 pr-12 py-3 border-2 border-blue-100 rounded-lg focus:border-blue-500 focus:ring-0 text-lg font-bold text-gray-700"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">O cliente pagará a tarifa da concessionária menos esse desconto.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-green-700 mb-1">Valor Fixo do kWh (R$)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">R$</span>
                  </div>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 0.85"
                    {...register('valor_kw')}
                    className="w-full pl-12 pr-4 py-3 border-2 border-green-100 rounded-lg focus:border-green-500 focus:ring-0 text-lg font-bold text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">O cliente pagará exatamente esse valor por cada kWh compensado.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('observacao')} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Consumidor'}
        </button>
      </form>
    </div>
  );
}
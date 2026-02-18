import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Save, User, Phone, Mail, MapPin, 
  FileText, Building, DollarSign, Percent 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FormularioConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
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
            setValue('documento', data.documento || data.cpf_cnpj); 
            setValue('email', data.email);       
            setValue('telefone', data.telefone); 
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
    <div className="max-w-3xl mx-auto animate-fade-in-down pb-20">
      
      {/* CABEÇALHO */}
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar à lista
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id ? 'Editar Consumidor' : 'Novo Consumidor'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Preencha os dados abaixo para cadastrar um novo cliente.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* 1. DADOS PESSOAIS (CARD) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <User className="w-5 h-5 text-blue-500" />
            Dados Pessoais
          </h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Nome Completo (Titular)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('nome', { required: true })}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                  placeholder="Nome do cliente"
                />
              </div>
              {errors.nome && <span className="text-red-500 text-xs ml-1 mt-1 font-medium">Este campo é obrigatório</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">CPF / CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('documento')}
                    placeholder="000.000.000-00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('telefone')}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="cliente@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ENDEREÇO (CARD) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <MapPin className="w-5 h-5 text-blue-500" />
            Endereço
          </h3>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">CEP</label>
                <input 
                  {...register('cep')} 
                  placeholder="00000-000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Bairro</label>
                <input 
                  {...register('bairro')} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Logradouro</label>
              <input 
                {...register('endereco')} 
                placeholder="Rua, Número, Complemento"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300" 
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Cidade</label>
                <input 
                  {...register('cidade')} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">UF</label>
                <input 
                  {...register('uf')} 
                  maxLength={2} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase text-center font-bold" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. DADOS COMERCIAIS (CARD DESTAQUE) */}
        <div className="bg-white p-8 rounded-2xl shadow-md shadow-blue-50 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <Building className="w-5 h-5 text-blue-500" />
            Dados Comerciais & Cobrança
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Média de Consumo Mensal (kWh)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">kWh</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('media_consumo')}
                  placeholder="Ex: 500"
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* SELETOR DE TIPO DE COBRANÇA (RADIO CARDS) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 ml-1">Como este cliente será cobrado?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setTipoCobranca('desconto');
                    setValue('valor_kw', '');
                  }}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    tipoCobranca === 'desconto' 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${tipoCobranca === 'desconto' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <Percent className="w-5 h-5" />
                    </div>
                    <span className={`font-bold ${tipoCobranca === 'desconto' ? 'text-blue-700' : 'text-gray-700'}`}>Desconto Garantido</span>
                  </div>
                  <p className="text-xs text-gray-500">O cliente recebe um desconto percentual sobre a tarifa da concessionária.</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoCobranca('fixo');
                    setValue('percentual_desconto', '');
                  }}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    tipoCobranca === 'fixo' 
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                      : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${tipoCobranca === 'fixo' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <span className={`font-bold ${tipoCobranca === 'fixo' ? 'text-green-700' : 'text-gray-700'}`}>Valor Fixo kWh</span>
                  </div>
                  <p className="text-xs text-gray-500">O cliente paga um valor fixo em reais por cada kWh consumido.</p>
                </button>
              </div>
            </div>

            {/* INPUT CONDICIONAL (COM ANIMAÇÃO) */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in-down">
              {tipoCobranca === 'desconto' ? (
                <div>
                  <label className="block text-sm font-bold text-blue-700 mb-1.5 ml-1">Percentual de Desconto (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 15"
                      {...register('percentual_desconto')}
                      className="w-full pl-4 pr-12 py-4 border-2 border-blue-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-2xl font-bold text-gray-800 transition-all placeholder:text-gray-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                      <Percent className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-green-700 mb-1.5 ml-1">Valor do kWh (R$)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                      <span className="text-green-600 font-bold text-xl">R$</span>
                    </div>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="0.85"
                      {...register('valor_kw')}
                      className="w-full pl-16 pr-4 py-4 border-2 border-green-200 rounded-xl outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 text-2xl font-bold text-gray-800 transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Observações Internas</label>
              <textarea 
                {...register('observacao')} 
                rows={3} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300 resize-none"
                placeholder="Detalhes adicionais sobre o cliente..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-6 h-6" />
              {id ? 'Salvar Alterações' : 'Cadastrar Consumidor'}
            </>
          )}
        </button>

      </form>
    </div>
  );
}
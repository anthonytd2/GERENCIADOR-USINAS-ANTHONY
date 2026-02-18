import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { 
  ArrowLeft, Save, Zap, FileText, User, Mail, Phone, MapPin, 
  Sun, DollarSign, Calendar, FileDigit, BarChart3, Fingerprint, Activity 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UsinaFormInput } from '../../types';

export default function FormularioUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 'trigger' serve para disparar a validação manual quando clicar nos botões
  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<UsinaFormInput>();
  const [loading, setLoading] = useState(false);
  
  // Estado visual para os botões
  const [tipoPagamentoVisual, setTipoPagamentoVisual] = useState<string>('');
  
  const tipoPagamentoForm = watch('tipo_pagamento');

  // Sincroniza visual com o formulário
  useEffect(() => {
    if (tipoPagamentoForm) {
      setTipoPagamentoVisual(tipoPagamentoForm);
    }
  }, [tipoPagamentoForm]);

  useEffect(() => {
    if (id && id !== 'novo') {
      setLoading(true);
      api.usinas.get(Number(id))
        .then((data: any) => {
          if (data) {
            // --- DADOS TÉCNICOS ---
            setValue('nome', data.nome || data.nome_proprietario); 
            setValue('numero_uc', data.numero_uc || data.uc_usina); 
            setValue('tipo', data.tipo);
            setValue('potencia', data.potencia);
            setValue('geracao_estimada', data.geracao_estimada);
            setValue('valor_kw_bruto', data.valor_kw_bruto);

            // --- CONTRATO ---
            setValue('inicio_contrato', data.inicio_contrato ? data.inicio_contrato.split('T')[0] : '');
            setValue('vencimento_contrato', data.vencimento_contrato ? data.vencimento_contrato.split('T')[0] : '');
            
            // SE VIER NULL DO BANCO (PORQUE VOCÊ LIMPOU), ELE FICA VAZIO E OBRIGA A ESCOLHER
            const tipo = data.tipo_pagamento ? data.tipo_pagamento.toUpperCase() : '';
            setValue('tipo_pagamento', tipo);
            setTipoPagamentoVisual(tipo);

            // --- PROPRIETÁRIO ---
            setValue('cpf_cnpj', data.cpf_cnpj);
            setValue('rg', data.rg);
            setValue('telefone', data.telefone);
            setValue('email', data.email);
            setValue('endereco', data.endereco_proprietario || data.endereco);
            setValue('observacao', data.observacao);
          }
        })
        .catch(err => {
          console.error("Erro:", err);
          toast.error("Erro ao carregar dados.");
        })
        .finally(() => setLoading(false));
    }
  }, [id, setValue]);

  // Função para mudar o valor e avisar o formulário que mudou
  const selecionarTipo = (valor: 'CONSUMO' | 'INJETADO') => {
    setTipoPagamentoVisual(valor);
    setValue('tipo_pagamento', valor, { shouldValidate: true, shouldDirty: true });
    trigger('tipo_pagamento'); // Remove o erro vermelho na hora
  };

  const onSubmit = async (data: UsinaFormInput) => {
    setLoading(true);
    const toastId = toast.loading('Salvando dados da usina...');

    try {
      const payload = {
        nome: data.nome,
        numero_uc: data.numero_uc,
        tipo: data.tipo,
        endereco_proprietario: data.endereco, 
        cpf_cnpj: data.cpf_cnpj,
        rg: data.rg,
        email: data.email,
        telefone: data.telefone,
        observacao: data.observacao,
        potencia: Number(data.potencia) || 0,
        geracao_estimada: Number(data.geracao_estimada) || 0,
        valor_kw_bruto: Number(data.valor_kw_bruto) || 0,
        inicio_contrato: data.inicio_contrato || null,
        vencimento_contrato: data.vencimento_contrato || null,
        
        // Garante envio maiúsculo ou null se vazio (mas a validação barra antes)
        tipo_pagamento: data.tipo_pagamento ? data.tipo_pagamento.toUpperCase() : null
      };

      if (id && id !== 'novo') {
        await api.usinas.update(Number(id), payload);
        toast.success('Usina atualizada!', { id: toastId });
      } else {
        await api.usinas.create(payload);
        toast.success('Usina criada!', { id: toastId });
      }

      setTimeout(() => navigate('/usinas'), 1000);

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar.`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-down">

      {/* HEADER */}
      <div className="mb-8">
        <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 font-medium transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar à lista
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl shadow-sm">
            <Sun className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {id && id !== 'novo' ? 'Editar Usina' : 'Cadastrar Nova Usina'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Preencha os dados técnicos e contratuais da unidade geradora.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* --- 1. DADOS TÉCNICOS --- */}
        <div className="bg-white p-8 rounded-2xl shadow-md shadow-yellow-50/50 border border-yellow-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 
            Informações Técnicas
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Nome de Identificação *</label>
                <div className="relative">
                  <Sun className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('nome', { required: 'Nome é obrigatório' })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all placeholder:text-gray-300 font-medium"
                    placeholder="Ex: Usina Fazenda Sol Nascente"
                  />
                </div>
                {errors.nome && <span className="text-red-500 text-xs ml-1 mt-1 font-bold">Campo obrigatório</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Nº da Unidade Consumidora (UC)</label>
                <div className="relative">
                  <FileDigit className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('numero_uc')}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                    placeholder="Ex: 12345678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Tipo da Instalação</label>
                <div className="relative">
                  <select 
                    {...register('tipo')} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white"
                  >
                    <option value="Solo">Solo</option>
                    <option value="Telhado">Telhado</option>
                    <option value="GD1">GD1</option>
                    <option value="GD2">GD2</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Potência (kWp) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">kWp</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('potencia', { required: true })} 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-bold text-gray-800"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Geração (kWh/mês) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">kWh</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    {...register('geracao_estimada', { required: true })} 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all font-bold text-gray-800"
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-green-700 mb-1.5 ml-1">Valor do kW Bruto (R$) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">R$</span>
                  <input 
                    type="number" 
                    step="0.0001" 
                    {...register('valor_kw_bruto', { required: true })} 
                    className="w-full pl-10 pr-4 py-3 border border-green-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-bold text-green-800 shadow-sm"
                    placeholder="0.0000"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. DADOS CONTRATUAIS --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <FileText className="w-5 h-5 text-blue-500" /> 
            Dados Contratuais
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 ml-1">Modalidade do Contrato *</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => selecionarTipo('CONSUMO')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    tipoPagamentoVisual === 'CONSUMO' 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${tipoPagamentoVisual === 'CONSUMO' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block font-bold ${tipoPagamentoVisual === 'CONSUMO' ? 'text-blue-700' : 'text-gray-700'}`}>Consumo (Rateio)</span>
                    <span className="text-xs text-gray-500">Distribuição percentual de créditos</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => selecionarTipo('INJETADO')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    tipoPagamentoVisual === 'INJETADO' 
                      ? 'border-green-500 bg-green-50 ring-1 ring-green-500' 
                      : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-full ${tipoPagamentoVisual === 'INJETADO' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`block font-bold ${tipoPagamentoVisual === 'INJETADO' ? 'text-green-700' : 'text-gray-700'}`}>Injetado (Venda Pura)</span>
                    <span className="text-xs text-gray-500">Venda total da energia gerada</span>
                  </div>
                </button>
              </div>

              {/* INPUT ESCONDIDO OBRIGATÓRIO */}
              <input 
                type="hidden" 
                {...register('tipo_pagamento', { required: 'Selecione uma modalidade de contrato' })} 
              />
              
              {/* MENSAGEM DE ERRO BEM VISÍVEL */}
              {errors.tipo_pagamento && (
                <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
                  <span className="text-xl">⚠️</span>
                  <span className="font-bold">Atenção: Você precisa selecionar uma modalidade acima!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Início do Contrato</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="date" 
                    {...register('inicio_contrato')} 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-600" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Vencimento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="date" 
                    {...register('vencimento_contrato')} 
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-600" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. DADOS DO PROPRIETÁRIO --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b border-gray-100">
            <User className="w-5 h-5 text-gray-500" /> 
            Dados do Proprietário
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">CPF / CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input {...register('cpf_cnpj')} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">RG</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input {...register('rg')} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" {...register('email')} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="tel" {...register('telefone')} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input {...register('endereco')} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300" />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Observações Gerais</label>
              <textarea 
                {...register('observacao')} 
                rows={3} 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-300 resize-none"
                placeholder="Detalhes técnicos adicionais ou anotações..."
              ></textarea>
            </div>
          </div>
        </div>

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
              {id && id !== 'novo' ? 'Salvar Alterações' : 'Finalizar Cadastro'}
            </>
          )}
        </button>

      </form>
    </div>
  );
}
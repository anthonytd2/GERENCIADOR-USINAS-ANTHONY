import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { ArrowLeft, Save, Zap, FileText, User, Mail, Phone, MapPin, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { UsinaFormInput } from '../../types';

export default function FormularioUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UsinaFormInput>();
  const [loading, setLoading] = useState(false);

  // CARREGAR DADOS
  useEffect(() => {
    if (id && id !== 'novo') {
      setLoading(true);
      api.usinas.get(Number(id))
        .then(data => {
          if (data) {
            // Campos Básicos
            setValue('nome_proprietario', data.nome_proprietario);
            setValue('numero_uc', data.numero_uc); // <--- NOVO: Carregando UC
            setValue('tipo', data.tipo);
            setValue('potencia', data.potencia);
            setValue('geracao_estimada', data.geracao_estimada);
            setValue('valor_kw_bruto', data.valor_kw_bruto);

            // Campos de Contrato
            setValue('inicio_contrato', data.inicio_contrato ? data.inicio_contrato.split('T')[0] : '');
            setValue('vencimento_contrato', data.vencimento_contrato ? data.vencimento_contrato.split('T')[0] : '');
            setValue('tipo_pagamento', data.tipo_pagamento);

            // Campos do Proprietário
            setValue('cpf_cnpj', data.cpf_cnpj);
            setValue('rg', data.rg);
            setValue('endereco_proprietario', data.endereco_proprietario);
            setValue('telefone', data.telefone);
            setValue('email', data.email);

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

  const onSubmit = async (data: UsinaFormInput) => {
    setLoading(true);
    const toastId = toast.loading('Salvando dados da usina...');

    try {
      const payload = {
        ...data,
        potencia: Number(data.potencia) || 0,
        geracao_estimada: Number(data.geracao_estimada) || 0,
        valor_kw_bruto: Number(data.valor_kw_bruto) || 0,
      };

      if (id && id !== 'novo') {
        await api.usinas.update(Number(id), payload);
        toast.success('Usina atualizada com sucesso!', { id: toastId });
      } else {
        await api.usinas.create(payload);
        toast.success('Usina criada com sucesso!', { id: toastId });
      }

      setTimeout(() => navigate('/usinas'), 1000);

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in-down">

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {id && id !== 'novo' ? 'Editar Usina' : 'Cadastrar Nova Usina'}
          </h1>
          <p className="text-gray-500">Preencha os dados técnicos e contratuais da unidade geradora.</p>
        </div>

        <button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Usina'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* --- CARD 1: DADOS TÉCNICOS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
            <Zap className="w-5 h-5 text-yellow-500" /> Informações Técnicas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nome do Proprietário */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome de Identificação (Proprietário) *</label>
              <input
                {...register('nome_proprietario', { required: 'Nome é obrigatório' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-all"
                placeholder="Ex: Usina Fazenda Sol Nascente"
              />
              {errors.nome_proprietario && <span className="text-red-500 text-xs">{String(errors.nome_proprietario.message)}</span>}
            </div>

            {/* --- NOVO CAMPO: UC --- */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nº da Unidade Consumidora (UC)</label>
              <input
                {...register('numero_uc')}
                className="w-full px-4 py-2 border border-blue-200 bg-blue-50/30 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 12345678"
              />
              <p className="text-xs text-gray-400 mt-1">Número do relógio/medidor na concessionária.</p>
            </div>
            {/* ---------------------- */}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo da Usina</label>
              <select {...register('tipo')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="Solo">Solo</option>
                <option value="Telhado">Telhado</option>
                <option value="GD1">GD1</option>
                <option value="GD2">GD2</option>
                <option value="Solo - GD1">Solo - GD1</option>
                <option value="Solo - GD2">Solo - GD2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Potência (kWp) *</label>
              <input type="number" step="0.01" {...register('potencia', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Geração Estimada (kWh/mês) *</label>
              <input type="number" step="0.01" {...register('geracao_estimada', { required: true })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Valor do kW Bruto (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400">R$</span>
                <input type="number" step="0.0001" {...register('valor_kw_bruto', { required: true })} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD 2: CONTRATO & FINANCEIRO --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText className="w-5 h-5 text-blue-500" /> Dados Contratuais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Modalidade de Pagamento</label>
              <select
                {...register('tipo_pagamento')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50/50 border-blue-200 text-blue-800 font-medium"
              >
                <option value="">Selecione...</option>
                {/* AGORA O VALOR É REAL: Sem conversão de "Aluguel Fixo" */}
                <option value="Consumo">Consumo</option>
                <option value="Injetado">Injetado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Data de Início</label>
              <input type="date" {...register('inicio_contrato')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vencimento</label>
              <input type="date" {...register('vencimento_contrato')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* --- CARD 3: DADOS DO PROPRIETÁRIO --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 pb-2 border-b border-gray-100">
            <User className="w-5 h-5 text-gray-500" /> Dados do Proprietário
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CPF e RG */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">CPF ou CNPJ</label>
              <input {...register('cpf_cnpj')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">RG</label>
              <input {...register('rg')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="0.000.000-0" />
            </div>

            {/* EMAIL E TELEFONE */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input type="email" {...register('email')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefone / WhatsApp
              </label>
              <input type="tel" {...register('telefone')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="(00) 90000-0000" />
            </div>

            {/* Endereço ocupa linha inteira */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Endereço Completo
              </label>
              <input {...register('endereco_proprietario')} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Rua, Número, Bairro, Cidade - UF" />
            </div>
          </div>
        </div>

        {/* OBSERVAÇÕES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Observações Gerais</label>
          <textarea
            {...register('observacao')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Alguma informação importante sobre essa usina..."
          ></textarea>
        </div>

      </form>
    </div>
  );
}
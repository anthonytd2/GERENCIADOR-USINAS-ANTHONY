import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { UsinaFormInput } from '../../types'; // <--- Adicione

export default function FormularioUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Agora o formulário sabe que campos como 'potencia' e 'geracao_estimada' existem
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UsinaFormInput>();
  const [loading, setLoading] = useState(false);

  // CARREGAR DADOS PARA EDIÇÃO
  useEffect(() => {
    if (id && id !== 'novo') {
      setLoading(true);
      api.usinas.get(Number(id))
        .then(data => {
          if (data) {
            console.log("Dados carregados:", data); // Para diagnóstico
            // Forçamos o preenchimento campo a campo para garantir
            setValue('nome_proprietario', data.nome_proprietario);
            setValue('cpf_cnpj', data.cpf_cnpj);
            setValue('rg', data.rg);
            setValue('endereco_proprietario', data.endereco_proprietario);
            setValue('potencia', data.potencia);
            setValue('geracao_estimada', data.geracao_estimada);
            setValue('valor_kw_bruto', data.valor_kw_bruto);
            setValue('tipo', data.tipo);
            setValue('inicio_contrato', data.inicio_contrato ? data.inicio_contrato.split('T')[0] : '');
            setValue('vencimento_contrato', data.vencimento_contrato ? data.vencimento_contrato.split('T')[0] : '');
            setValue('tipo_pagamento', data.tipo_pagamento);
            setValue('observacao', data.observacao);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar usina:", err);
          toast.error("Erro ao carregar dados da usina."); // <--- ADICIONAR ISSO
        })
        .finally(() => setLoading(false));
    }
  }, [id, setValue]);

  const onSubmit = async (data: UsinaFormInput) => {
    setLoading(true);

    // 1. Inicia o aviso de "Carregando"
    // Esse 'toastId' serve para a gente atualizar essa mesma mensagem depois
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
        // 2. Se deu certo, transforma o aviso de carregando em Sucesso (Verde)
        toast.success('Usina atualizada com sucesso!', { id: toastId });
      } else {
        await api.usinas.create(payload);
        toast.success('Usina criada com sucesso!', { id: toastId });
      }

      // 3. Pequeno delay para o usuário ler a mensagem antes de sair da tela
      setTimeout(() => {
        navigate('/usinas');
      }, 1000);

    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      const msg = error.response?.data?.error || error.message || "Erro desconhecido";

      // 4. Se deu erro, transforma o aviso em Erro (Vermelho)
      toast.error(`Erro ao salvar: ${msg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/usinas" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {id && id !== 'novo' ? 'Editar Usina' : 'Nova Usina'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">

        {/* NOME DO PROPRIETÁRIO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Proprietário *</label>
          <input
            {...register('nome_proprietario', { required: 'Nome é obrigatório' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: João Silva"
          />
          {errors.nome_proprietario && <span className="text-red-500 text-sm">{String(errors.nome_proprietario.message)}</span>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* POTÊNCIA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Potência (kWp) *</label>
            <input
              type="number"
              step="0.01"
              {...register('potencia', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* GERAÇÃO ESTIMADA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimação de Geração (kWh/mês) *</label>
            <input
              type="number"
              step="0.01"
              {...register('geracao_estimada', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* VALOR KW */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do kW (R$) *</label>
            <input
              type="number"
              step="0.01"
              {...register('valor_kw_bruto', { required: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* TIPO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo da Usina</label>
            <select {...register('tipo')} className="w-full px-4 py-2 border border-gray-300 rounded-lg">

              <option value="GD1">GD1</option>
              <option value="GD2">GD2</option>

            </select>
          </div>
        </div>

        {/* DATAS DE CONTRATO */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início do Contrato</label>
            <input
              type="date"
              {...register('inicio_contrato')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento do Contrato</label>
            <input
              type="date"
              {...register('vencimento_contrato')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* TIPO PAGAMENTO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
          <select {...register('tipo_pagamento')} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
            <option value="">Selecione...</option>
            <option value="Aluguel Fixo">Consumo</option>
            <option value="Percentual">Injetado</option>
          </select>
        </div>

        {/* --- BLOCO: DADOS PARA CONTRATO --- */}
        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            Dados para Contrato <span className="text-xs font-normal text-gray-500">(Opcional)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Mudei para 3 colunas */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ</label>
              <input
                {...register('cpf_cnpj')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
              />
            </div>

            {/* --- CAMPO NOVO: RG --- */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RG (Identidade)</label>
              <input
                {...register('rg')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.000.000-0"
              />
            </div>
            {/* ---------------------- */}

            <div className="md:col-span-1"> {/* Endereço ocupa o resto ou ajusta conforme preferir */}
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <input
                {...register('endereco_proprietario')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Rua, Número, Cidade - UF"
              />
            </div>
          </div>
        </div>

        {/* OBSERVAÇÃO */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            {...register('observacao')}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-DEFAULT text-white rounded-xl hover:bg-brand-dark font-bold shadow-lg shadow-blue-900/20 transition-all flex justify-center items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Salvando...' : 'Salvar Usina'}
        </button>
      </form>
    </div>
  );
}
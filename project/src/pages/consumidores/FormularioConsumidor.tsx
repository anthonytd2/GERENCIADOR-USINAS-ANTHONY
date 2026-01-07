import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save, MapPin, FileText } from 'lucide-react';

export default function FormularioConsumidor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    Nome: '',
    Documento: '', // CPF ou CNPJ
    MediaConsumo: '',
    PercentualDesconto: '',
    TipoDesconto: 'porcentagem',
    TempoContratoAnos: '',
    InicioContrato: '',
    VencimentoContrato: '',
    Vendedor: '',
    Observacao: '',
    // Endereço
    Endereco: '',
    Bairro: '',
    Cidade: '',
    UF: '',
    CEP: ''
  });

  useEffect(() => {
    if (isEditing) {
      api.consumidores.get(Number(id)).then((data) => {
        setFormData({
          Nome: data.Nome,
          Documento: data.Documento || '',
          MediaConsumo: data.MediaConsumo,
          PercentualDesconto: data.PercentualDesconto,
          TipoDesconto: data.TipoDesconto || 'porcentagem',
          TempoContratoAnos: data.TempoContratoAnos,
          InicioContrato: data.InicioContrato,
          VencimentoContrato: data.VencimentoContrato,
          Vendedor: data.Vendedor,
          Observacao: data.Observacao || '',
          Endereco: data.Endereco || '',
          Bairro: data.Bairro || '',
          Cidade: data.Cidade || '',
          UF: data.UF || '',
          CEP: data.CEP || ''
        });
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        MediaConsumo: Number(formData.MediaConsumo),
        PercentualDesconto: Number(formData.PercentualDesconto),
        TempoContratoAnos: Number(formData.TempoContratoAnos),
      };

      if (isEditing) {
        await api.consumidores.update(Number(id), dataToSend);
      } else {
        await api.consumidores.create(dataToSend);
      }
      navigate('/consumidores');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar consumidor');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/consumidores" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Consumidor' : 'Novo Consumidor'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
        
        {/* DADOS PRINCIPAIS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-[#0B1E3F] flex items-center gap-2">
            <FileText className="w-5 h-5" /> Dados Cadastrais
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social</label>
              <input type="text" required value={formData.Nome}
                onChange={e => setFormData({ ...formData, Nome: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" placeholder="Ex: João da Silva ME" />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
              <input type="text" value={formData.Documento}
                onChange={e => setFormData({ ...formData, Documento: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" placeholder="00.000.000/0001-00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Média de Consumo (kWh)</label>
              <input type="number" required value={formData.MediaConsumo}
                onChange={e => setFormData({ ...formData, MediaConsumo: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" placeholder="0" />
            </div>

            {/* SELEÇÃO DO TIPO DE COBRANÇA */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 col-span-2 md:col-span-1">
              <label className="block text-sm font-bold text-blue-900 mb-2">Forma de Cobrança</label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipoDesconto" value="porcentagem"
                    checked={formData.TipoDesconto === 'porcentagem'}
                    onChange={() => setFormData({ ...formData, TipoDesconto: 'porcentagem' })}
                    className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">Porcentagem (%)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="tipoDesconto" value="valor_fixo"
                    checked={formData.TipoDesconto === 'valor_fixo'}
                    onChange={() => setFormData({ ...formData, TipoDesconto: 'valor_fixo' })}
                    className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium">Valor Fixo (R$)</span>
                </label>
              </div>

              <div className="relative">
                {formData.TipoDesconto === 'valor_fixo' && (
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-bold">R$</span>
                  </div>
                )}
                <input 
                  type="number" step="0.01" required value={formData.PercentualDesconto}
                  onChange={e => setFormData({ ...formData, PercentualDesconto: e.target.value })}
                  className={`w-full rounded-lg border-blue-300 focus:border-blue-500 focus:ring-blue-500 ${
                    formData.TipoDesconto === 'valor_fixo' ? 'pl-10' : 'pl-3'
                  }`}
                  placeholder={formData.TipoDesconto === 'porcentagem' ? "Ex: 15" : "Ex: 0.85"} 
                />
                {formData.TipoDesconto === 'porcentagem' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-bold">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-[#0B1E3F] flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Endereço Completo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input type="text" value={formData.CEP}
                onChange={e => setFormData({ ...formData, CEP: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" placeholder="00000-000" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" value={formData.Cidade}
                onChange={e => setFormData({ ...formData, Cidade: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <input type="text" value={formData.UF} maxLength={2}
                onChange={e => setFormData({ ...formData, UF: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" placeholder="PR" />
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro (Rua, Av, Nº)</label>
              <input type="text" value={formData.Endereco}
                onChange={e => setFormData({ ...formData, Endereco: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input type="text" value={formData.Bairro}
                onChange={e => setFormData({ ...formData, Bairro: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* DETALHES DO CONTRATO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold mb-4 text-[#0B1E3F]">Detalhes do Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Contrato (Anos)</label>
              <input type="number" value={formData.TempoContratoAnos}
                onChange={e => setFormData({ ...formData, TempoContratoAnos: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
              <input type="text" value={formData.Vendedor}
                onChange={e => setFormData({ ...formData, Vendedor: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início Contrato</label>
              <input type="date" value={formData.InicioContrato}
                onChange={e => setFormData({ ...formData, InicioContrato: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento Contrato</label>
              <input type="date" value={formData.VencimentoContrato}
                onChange={e => setFormData({ ...formData, VencimentoContrato: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
              <textarea 
                rows={4}
                value={formData.Observacao}
                onChange={e => setFormData({ ...formData, Observacao: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Detalhes adicionais..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-1">
            <Save className="w-5 h-5" /> Salvar Cadastro
          </button>
        </div>
      </form>
    </div>
  );
}
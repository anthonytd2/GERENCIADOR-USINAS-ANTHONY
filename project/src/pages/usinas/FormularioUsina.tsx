import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save, Sun, Zap, MapPin, DollarSign } from 'lucide-react';
import GerenciadorDocumentos from '../../components/GerenciadorDocumentos';

export default function FormularioUsina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Lista de Concessionárias para o Dropdown
  const [concessionarias, setConcessionarias] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    NomeProprietario: '',
    UnidadeConsumidora: '',
    ConcessionariaID: '',
    Potencia: 0,
    ValorKWBruto: 0,
    Tipo: 'Solo', // Solo ou Telhado
    Endereco: '' // Se tiver campo endereço
  });

  // Carrega dados iniciais
  useEffect(() => {
    // 1. Carrega Concessionárias
    api.concessionarias.list().then(setConcessionarias).catch(console.error);

    // 2. Se for edição, carrega a Usina
    if (id) {
      setLoading(true);
      api.usinas.get(Number(id))
        .then((data: any) => {
          setFormData({
            NomeProprietario: data.NomeProprietario || '',
            UnidadeConsumidora: data.UnidadeConsumidora || '',
            ConcessionariaID: data.ConcessionariaID || '',
            Potencia: data.Potencia || 0,
            ValorKWBruto: data.ValorKWBruto || 0,
            Tipo: data.Tipo || 'Solo',
            Endereco: data.Endereco || ''
          });
        })
        .catch((err: any) => {
          console.error(err);
          alert('Erro ao carregar usina.');
          navigate('/usinas');
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        NomeProprietario: formData.NomeProprietario,
        UnidadeConsumidora: formData.UnidadeConsumidora,
        ConcessionariaID: Number(formData.ConcessionariaID),
        Potencia: Number(formData.Potencia),
        ValorKWBruto: Number(formData.ValorKWBruto),
        Tipo: formData.Tipo,
        Endereco: formData.Endereco
      };

      if (id) {
        await api.usinas.update(Number(id), payload);
        alert('Usina atualizada com sucesso!');
        navigate('/usinas');
      } else {
        const nova = await api.usinas.create(payload);
        alert('Usina cadastrada com sucesso!');
        // Vai para edição para liberar o cofre
        navigate(`/usinas/${nova.id}/editar`);
      }
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/usinas" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar Usina' : 'Nova Usina'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* IDENTIFICAÇÃO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Sun className="w-5 h-5 text-orange-500"/> Identificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Proprietário / Usina</label>
              <input type="text" name="NomeProprietario" required value={formData.NomeProprietario} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Ex: Usina Sol Maior I" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº da UC (Instalação)</label>
              <input type="text" name="UnidadeConsumidora" value={formData.UnidadeConsumidora} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concessionária</label>
              <select name="ConcessionariaID" required value={formData.ConcessionariaID} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                <option value="">Selecione...</option>
                {concessionarias.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* DADOS TÉCNICOS & FINANCEIROS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Zap className="w-5 h-5 text-yellow-500"/> Dados Técnicos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Potência (kWp)</label>
               <input type="number" step="0.01" name="Potencia" value={formData.Potencia} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Estrutura</label>
               <select name="Tipo" value={formData.Tipo} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                 <option value="Solo">Solo</option>
                 <option value="Telhado">Telhado</option>
                 <option value="Carport">Carport</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Crédito (R$)</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <DollarSign className="h-4 w-4 text-gray-400" />
                 </div>
                 <input type="number" step="0.01" name="ValorKWBruto" value={formData.ValorKWBruto} onChange={handleChange} className="w-full pl-8 p-2 border rounded-lg" placeholder="0.00" />
               </div>
               <p className="text-xs text-gray-500 mt-1">Preço de venda do kWh</p>
            </div>
          </div>
        </div>

        {/* ENDEREÇO (SIMPLES) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <MapPin className="w-5 h-5 text-green-500"/> Localização
          </h2>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
             <input type="text" name="Endereco" value={formData.Endereco} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Rua, Cidade, Estado..." />
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex justify-end gap-3">
          <Link to="/usinas" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-brand-DEFAULT text-white rounded-lg font-bold hover:bg-brand-dark transition-all shadow-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Usina'}
          </button>
        </div>
      </form>

      {/* --- COFRE DE DOCUMENTOS (SÓ NA EDIÇÃO) --- */}
      <div className="mt-12 border-t pt-8">
        {id ? (
          <GerenciadorDocumentos tipoEntidade="usina" entidadeId={Number(id)} />
        ) : (
          <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-gray-500 font-medium">
              🔒 Salve a usina para liberar o upload de projetos e documentos.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
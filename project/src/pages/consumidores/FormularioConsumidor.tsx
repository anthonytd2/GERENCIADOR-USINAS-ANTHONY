import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save, User, Zap, MapPin } from 'lucide-react';
import GerenciadorDocumentos from '../../components/GerenciadorDocumentos'; // <--- IMPORTANTE

export default function FormularioConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Estado inicial do formulário
  const [formData, setFormData] = useState({
    Nome: '',
    Documento: '', // CPF/CNPJ
    Email: '',
    Telefone: '',
    UnidadeConsumidora: '',
    Tensao: '220V', // Valor padrão
    Fasico: 'Monofásico', // Valor padrão
    PercentualDesconto: 0,
    MediaConsumo: 0,
    // Endereço
    Logradouro: '',
    Numero: '',
    Bairro: '',
    Cidade: '',
    UF: '',
    CEP: ''
  });

  // Carrega dados se for Edição
  useEffect(() => {
    if (id) {
      setLoading(true);
      api.consumidores.get(Number(id))
        .then((data: any) => {
          // Ajusta os dados para o formato do form (se o endereço vier aninhado)
          setFormData({
            Nome: data.Nome || '',
            Documento: data.Documento || '',
            Email: data.Email || '',
            Telefone: data.Telefone || '',
            UnidadeConsumidora: data.UnidadeConsumidora || '',
            Tensao: data.Tensao || '220V',
            Fasico: data.Fasico || 'Monofásico',
            PercentualDesconto: data.PercentualDesconto || 0,
            MediaConsumo: data.MediaConsumo || 0,
            // Achata o endereço se vier como objeto
            Logradouro: data.Endereco?.Logradouro || '',
            Numero: data.Endereco?.Numero || '',
            Bairro: data.Endereco?.Bairro || '',
            Cidade: data.Endereco?.Cidade || '',
            UF: data.Endereco?.UF || '',
            CEP: data.Endereco?.CEP || ''
          });
        })
        .catch((err: any) => {
          console.error(err);
          alert('Erro ao carregar dados do consumidor.');
          navigate('/consumidores');
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
      // Monta o objeto para enviar (reagrupa endereço)
      const payload = {
        Nome: formData.Nome,
        Documento: formData.Documento.replace(/\D/g, ''), // Limpa CPF
        Email: formData.Email,
        Telefone: formData.Telefone,
        UnidadeConsumidora: formData.UnidadeConsumidora,
        Tensao: formData.Tensao,
        Fasico: formData.Fasico,
        PercentualDesconto: Number(formData.PercentualDesconto),
        MediaConsumo: Number(formData.MediaConsumo),
        Endereco: {
          Logradouro: formData.Logradouro,
          Numero: formData.Numero,
          Bairro: formData.Bairro,
          Cidade: formData.Cidade,
          UF: formData.UF,
          CEP: formData.CEP
        }
      };

      if (id) {
        await api.consumidores.update(Number(id), payload);
        alert('Consumidor atualizado com sucesso!');
        navigate('/consumidores'); // Volta para a lista
      } else {
        const novo = await api.consumidores.create(payload);
        alert('Consumidor cadastrado com sucesso!');
        // Redireciona para a EDIÇÃO deste novo cliente para poder anexar documentos
        navigate(`/consumidores/${novo.ConsumidorID || novo.id}/editar`); 
      }
    } catch (error: any) {
      console.error(error);
      // Mostra erro vindo do Backend (Zod)
      alert('Erro ao salvar: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/consumidores" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar Consumidor' : 'Novo Consumidor'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* DADOS PESSOAIS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <User className="w-5 h-5 text-blue-500"/> Dados Pessoais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" name="Nome" required value={formData.Nome} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
              <input type="text" name="Documento" value={formData.Documento} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Apenas números" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
              <input type="text" name="Telefone" value={formData.Telefone} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="Email" value={formData.Email} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <MapPin className="w-5 h-5 text-green-500"/> Endereço
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
               <input type="text" name="CEP" value={formData.CEP} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
               <input type="text" name="Cidade" value={formData.Cidade} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro (Rua, Av.)</label>
               <input type="text" name="Logradouro" value={formData.Logradouro} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
               <input type="text" name="Numero" value={formData.Numero} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
               <input type="text" name="Bairro" value={formData.Bairro} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
               <input type="text" name="UF" maxLength={2} value={formData.UF} onChange={handleChange} className="w-full p-2 border rounded-lg uppercase" />
            </div>
          </div>
        </div>

        {/* DADOS TÉCNICOS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Zap className="w-5 h-5 text-yellow-500"/> Energia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Nº Unidade Consumidora (UC)</label>
               <input type="text" name="UnidadeConsumidora" value={formData.UnidadeConsumidora} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Média Consumo (kWh)</label>
               <input type="number" name="MediaConsumo" value={formData.MediaConsumo} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tensão</label>
               <select name="Tensao" value={formData.Tensao} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                 <option value="127V">127V</option>
                 <option value="220V">220V</option>
                 <option value="380V">380V</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Fásico</label>
               <select name="Fasico" value={formData.Fasico} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                 <option value="Monofásico">Monofásico</option>
                 <option value="Bifásico">Bifásico</option>
                 <option value="Trifásico">Trifásico</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">% Desconto Oferecido</label>
               <div className="flex items-center gap-2">
                 <input type="number" name="PercentualDesconto" value={formData.PercentualDesconto} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                 <span className="text-gray-500">%</span>
               </div>
            </div>
          </div>
        </div>

        {/* BOTÃO SALVAR */}
        <div className="flex justify-end gap-3">
          <Link to="/consumidores" className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-brand-DEFAULT text-white rounded-lg font-bold hover:bg-brand-dark transition-all shadow-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Salvando...' : 'Salvar Consumidor'}
          </button>
        </div>

      </form>

      {/* --- AQUI ESTÁ O COFRE DE DOCUMENTOS --- */}
      {/* Só aparece se tiver ID (Modo Edição) */}
      <div className="mt-12 border-t pt-8">
        {id ? (
          <GerenciadorDocumentos tipoEntidade="consumidor" entidadeId={Number(id)} />
        ) : (
          <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-gray-500 font-medium">
              🔒 O Cofre de Documentos ficará disponível após você salvar este novo consumidor.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, User, Zap, MapPin, Phone, Mail, FileText, AlertTriangle } from 'lucide-react';
import Skeleton from '../../components/Skeleton';
// Importação direta
import GerenciadorDocumentos from '../../components/GerenciadorDocumentos'; 

interface Consumidor {
  ConsumidorID: number;
  Nome: string;
  Email?: string;
  Telefone?: string;
  Documento?: string;
  UnidadeConsumidora?: string;
  Tensao?: string;
  Fasico?: string;
  PercentualDesconto: number;
  MediaConsumo: number;
  Endereco?: {
    Logradouro: string;
    Numero: string;
    Bairro: string;
    Cidade: string;
    UF: string;
    CEP: string;
  };
}

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<Consumidor | null>(null);
  const [loading, setLoading] = useState(true);

  console.log(">>> RENDERIZANDO TELA DETALHE CONSUMIDOR. ID:", id); // LOG DE DEBUG

  useEffect(() => {
    if (!id) return;
    api.consumidores.get(Number(id))
      .then((data: any) => setConsumidor(data))
      .catch((err: any) => {
        console.error(err);
        alert('Erro ao carregar consumidor');
        navigate('/consumidores');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este consumidor?')) return;
    try {
      await api.consumidores.delete(Number(id));
      alert('Consumidor excluído com sucesso!');
      navigate('/consumidores');
    } catch (error) {
      alert('Erro ao excluir consumidor');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-40" />
           <Skeleton className="h-40" />
           <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!consumidor) return <div>Consumidor não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/consumidores" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{consumidor.Nome}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Ativo</span>
              <span>•</span>
              <span>ID: {consumidor.ConsumidorID}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            to={`/consumidores/${id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>
        </div>
      </div>

      {/* GRID DE INFORMAÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* CARD 1: CONTATO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Dados Pessoais
          </h3>
          <div className="space-y-3 text-sm">
            <div><p className="text-gray-500 text-xs">Documento</p><p className="font-medium text-gray-900">{consumidor.Documento || 'Não informado'}</p></div>
            <div><p className="text-gray-500 text-xs">Email</p><div className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-400" /><p className="font-medium text-gray-900 truncate">{consumidor.Email || 'Não informado'}</p></div></div>
            <div><p className="text-gray-500 text-xs">Telefone</p><div className="flex items-center gap-2"><Phone className="w-3 h-3 text-gray-400" /><p className="font-medium text-gray-900">{consumidor.Telefone || 'Não informado'}</p></div></div>
          </div>
        </div>

        {/* CARD 2: ENERGIA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Dados Energéticos
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2"><span className="text-gray-500">UC</span><span className="font-bold text-gray-900">{consumidor.UnidadeConsumidora || 'N/A'}</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Média</span><span className="font-bold text-gray-900">{consumidor.MediaConsumo} kWh</span></div>
            <div className="flex justify-between pt-1">
               <div className="text-center w-1/2 border-r pr-2"><p className="text-xs text-gray-500">Tensão</p><p className="font-medium">{consumidor.Tensao || 'N/A'}</p></div>
               <div className="text-center w-1/2 pl-2"><p className="text-xs text-gray-500">Fase</p><p className="font-medium">{consumidor.Fasico || 'N/A'}</p></div>
            </div>
          </div>
        </div>

        {/* CARD 3: ENDEREÇO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-500" /> Endereço
          </h3>
          {consumidor.Endereco ? (
             <div className="space-y-2 text-sm text-gray-700">
               <p>{consumidor.Endereco.Logradouro}, {consumidor.Endereco.Numero}</p>
               <p>{consumidor.Endereco.Bairro}</p>
               <p>{consumidor.Endereco.Cidade} - {consumidor.Endereco.UF}</p>
               <p className="text-gray-400 text-xs mt-2">CEP: {consumidor.Endereco.CEP}</p>
             </div>
          ) : (
            <p className="text-gray-400 italic text-sm">Endereço não cadastrado.</p>
          )}
        </div>
      </div>

      {/* --- ÁREA DO COFRE DE DOCUMENTOS (DEBUG) --- */}
      <div className="mt-8 p-4 bg-yellow-50 border-4 border-red-500 rounded-xl">
         <h2 className="text-red-600 font-bold flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6"/>
            ZONA DE DOCUMENTOS (MODO DEBUG)
         </h2>
         <p className="mb-4 text-sm text-gray-700">Se você está vendo este quadrado amarelo, o arquivo DetalheConsumidor.tsx foi atualizado com sucesso.</p>
         
         {/* Renderização do componente */}
         <div className="bg-white p-2 border border-gray-300 rounded">
            <GerenciadorDocumentos tipoEntidade="consumidor" entidadeId={Number(id)} />
         </div>
      </div>

    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, MapPin, FileText, Zap, Plus, Building2 } from 'lucide-react';
import GerenciadorDocumentos from '../../components/GerenciadorDocumentos';

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]); // Lista de Filiais
  const [loading, setLoading] = useState(true);
  
  // Estado para o Modal de Nova UC (Simples)
  const [showModalUC, setShowModalUC] = useState(false);
  const [formUC, setFormUC] = useState({
    codigo_uc: '',
    endereco: '',
    bairro: '',
    cidade: '',
    uf: 'PR',
    cep: '',
    media_consumo: ''
  });

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    if (!id) return;
    try {
      const [dadosConsumidor, dadosUnidades] = await Promise.all([
        api.consumidores.get(Number(id)),
        api.consumidores.getUnidades(Number(id))
      ]);
      setConsumidor(dadosConsumidor);
      setUnidades(dadosUnidades || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir este consumidor?')) return;
    try {
      await api.consumidores.delete(Number(id));
      navigate('/consumidores');
    } catch (error) {
      alert('Erro ao excluir consumidor');
    }
  };

  const handleDeleteUC = async (ucId: number) => {
    if (!confirm('Excluir esta Unidade Consumidora?')) return;
    try {
      await api.consumidores.deleteUnidade(ucId);
      carregarDados(); // Recarrega a lista
    } catch (error) {
      alert('Erro ao excluir unidade');
    }
  };

  const handleSaveUC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.consumidores.createUnidade(Number(id), formUC);
      setShowModalUC(false);
      setFormUC({ codigo_uc: '', endereco: '', bairro: '', cidade: '', uf: 'PR', cep: '', media_consumo: '' }); // Limpa form
      carregarDados(); // Recarrega
    } catch (error) {
      alert('Erro ao salvar unidade');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  if (!consumidor) return <div className="p-8 text-center">Consumidor não encontrado</div>;

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{consumidor.nome}</h1>
            <div className="flex items-center gap-2 text-gray-500 mt-1">
              <FileText className="w-4 h-4" />

            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/consumidores/${id}/editar`} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Cartão de Contato / Endereço */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> Endereço Principal
          </h3>
          <div className="space-y-3 text-gray-600">
            <p><span className="font-medium text-gray-900">Endereço:</span> {consumidor.endereco || '-'}</p>
            <p><span className="font-medium text-gray-900">Bairro:</span> {consumidor.bairro || '-'}</p>
            <p><span className="font-medium text-gray-900">Cidade:</span> {consumidor.cidade || '-'} / {consumidor.uf || '-'}</p>
            <p><span className="font-medium text-gray-900">CEP:</span> {consumidor.cep || '-'}</p>
          </div>
        </div>

        {/* Cartão Comercial */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Dados Comerciais
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Média Consumo (Total)</p>
              <p className="text-xl font-bold text-gray-900">{consumidor.media_consumo} kWh</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Valor do kW</p>
              <p className="text-xl font-bold text-gray-900">R$ {consumidor.valor_kw}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTA DE FILIAIS / UCs --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" /> Unidades Consumidoras
          </h3>
          <button onClick={() => setShowModalUC(true)} className="px-3 py-1.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nova UC
          </button>
        </div>

        {unidades.length === 0 ? (
          <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Nenhuma cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Nº da UC</th>
                  <th className="px-4 py-3">Endereço / Local</th>
                  <th className="px-4 py-3">Cidade</th>
                  <th className="px-4 py-3 text-right">Consumo Médio</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unidades.map((uc) => (
                  <tr key={uc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{uc.codigo_uc}</td>
                    <td className="px-4 py-3 text-gray-600">{uc.endereco} - {uc.bairro}</td>
                    <td className="px-4 py-3 text-gray-600">{uc.cidade}/{uc.uf}</td>
                    <td className="px-4 py-3 text-right font-medium">{uc.media_consumo} kWh</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteUC(uc.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ÁREA DO COFRE DE DOCUMENTOS --- */}
      <div className="mt-8">
        <GerenciadorDocumentos tipoEntidade="consumidor" entidadeId={Number(id)} />
      </div>

      {/* --- MODAL NOVA UC --- */}
      {showModalUC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Adicionar Nova UC</h3>
            <form onSubmit={handleSaveUC} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número da UC (Copel)</label>
                <input required type="text" className="w-full p-2 border rounded" 
                  value={formUC.codigo_uc} onChange={e => setFormUC({...formUC, codigo_uc: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Média de Consumo (kWh)</label>
                <input type="number" className="w-full p-2 border rounded" 
                  value={formUC.media_consumo} onChange={e => setFormUC({...formUC, media_consumo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Endereço / Identificação</label>
                <input required type="text" placeholder="Ex: Av Brasil, 100 - Filial Centro" className="w-full p-2 border rounded" 
                  value={formUC.endereco} onChange={e => setFormUC({...formUC, endereco: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Bairro</label>
                    <input type="text" className="w-full p-2 border rounded" 
                      value={formUC.bairro} onChange={e => setFormUC({...formUC, bairro: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    <input type="text" className="w-full p-2 border rounded" 
                      value={formUC.cidade} onChange={e => setFormUC({...formUC, cidade: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModalUC(false)} className="flex-1 py-2 border rounded hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold">Salvar UC</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
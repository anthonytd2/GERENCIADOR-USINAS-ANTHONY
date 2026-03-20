import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Edit, Trash2, User, Zap, Plus, Building2, Phone, Mail, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import GerenciadorDocumentos from "../../components/GerenciadorDocumentos";
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { formatarDocumento } from '../../components/formatters';

const formatarRG = (valor?: string) => {
  if (!valor) return '-';
  if (/[a-zA-Z]/.test(valor)) return valor;
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros.length === 9) return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  if (apenasNumeros.length === 8) return apenasNumeros.replace(/(\d{1})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  return valor;
};

export default function DetalheConsumidor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [consumidor, setConsumidor] = useState<any>(null);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSenha, setShowSenha] = useState(false);

  const [modalExcluirOpen, setModalExcluirOpen] = useState(false);
  const [ucParaExcluir, setUcParaExcluir] = useState<number | null>(null);

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
    try {
      await api.consumidores.delete(Number(id));
      navigate('/consumidores');
    } catch (error) {
      alert('Erro ao excluir consumidor. Verifique se existem vínculos ativos.');
    } finally {
      setModalExcluirOpen(false);
    }
  };

  const confirmarExclusaoUC = async () => {
    if (!ucParaExcluir) return;
    try {
      await api.consumidores.deleteUnidade(ucParaExcluir);
      carregarDados();
    } catch (error) {
      alert('Erro ao excluir unidade');
    } finally {
      setUcParaExcluir(null);
    }
  };

  const handleSaveUC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await api.consumidores.createUnidade(Number(id), formUC);
      setShowModalUC(false);
      setFormUC({ codigo_uc: '', endereco: '', bairro: '', cidade: '', uf: 'PR', cep: '', media_consumo: '' });
      carregarDados();
    } catch (error) {
      alert('Erro ao salvar unidade');
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Carregando...</div>;
  if (!consumidor) return <div className="p-6 text-center">Consumidor não encontrado</div>;

  return (
    <div className="animate-fade-in-down pb-20">

      {/* Cabeçalho */}
      <div className="mb-8">
        <Link to="/consumidores" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cliente</h1>
          </div>
          <div className="flex gap-2">
            <Link to={`/consumidores/${id}/editar`} className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors shadow-sm">
              <Edit className="w-4 h-4" /> Editar
            </Link>
            <button
              onClick={() => setModalExcluirOpen(true)}
              className="px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* CARTÃO 1: DADOS PESSOAIS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <User className="w-5 h-5 text-blue-600" /> Dados Pessoais
          </h3>
          <div className="space-y-4 text-gray-700">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Nome Completo</p>
              <p className="font-bold text-lg text-gray-900">{consumidor.nome}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">CPF / CNPJ</p>
                <p className="font-mono bg-gray-50 inline-block px-2 py-1 rounded text-gray-900 border border-gray-200">
                  {formatarDocumento(consumidor.documento || consumidor.cpf_cnpj)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">RG</p>
                <p className="font-mono bg-gray-50 inline-block px-2 py-1 rounded text-gray-900 border border-gray-200">
                  {formatarRG(consumidor.rg)}
                </p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Insc. Estadual</p>
                <p className="font-mono bg-gray-50 inline-block px-2 py-1 rounded text-gray-900 border border-gray-200">
                  {consumidor.inscricao_estadual || '-'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Mail size={12} /> E-mail</p>
                <p className="text-sm truncate" title={consumidor.email}>{consumidor.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Phone size={12} /> Telefone</p>
                <p className="text-sm">{consumidor.telefone || '-'}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><MapPin size={12} /> Endereço</p>
              <p className="text-sm">{consumidor.endereco}, {consumidor.bairro}</p>
              <p className="text-sm">{consumidor.cidade}/{consumidor.uf} - {consumidor.cep}</p>
            </div>
          </div>
        </div>

        {/* CARTÃO 2: DADOS COMERCIAIS */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Zap className="w-5 h-5 text-yellow-500" /> Dados Comerciais
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 col-span-2">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Média Consumo</p>
              <p className="text-xl font-black text-gray-900">{consumidor.media_consumo?.toLocaleString('pt-BR')} <span className="text-sm text-gray-500">kWh</span></p>
            </div>
            <div className="col-span-2">
              {/* 🟢 Lógica corrigida no Detalhe para mostrar a caixa verde ou azul corretamente */}
              {consumidor.tipo_desconto === 'valor_fixo' ? (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 w-full">
                  <p className="text-xs text-green-700 font-bold uppercase mb-1">Valor Fixo</p>
                  <p className="text-xl font-black text-green-800">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(Number(consumidor.valor_kw))}
                    <span className="text-sm ml-1">/kWh</span>
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 w-full">
                  <p className="text-xs text-blue-700 font-bold uppercase mb-1">Desconto</p>
                  <p className="text-xl font-black text-blue-800">{consumidor.percentual_desconto}%</p>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Observações</p>
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200 italic">
                {consumidor.observacao || "Nenhuma observação registrada."}
              </p>
            </div>
          </div>
        </div>

        {/* CARTÃO 3: ACESSO COPEL */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Lock className="w-5 h-5 text-slate-600" /> Acesso Copel
          </h3>
          <div className="space-y-6 text-gray-700 mt-2">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Login do Portal</p>
              <div className="font-mono bg-slate-50 inline-block px-4 py-2 rounded-lg text-gray-900 border border-gray-200 font-bold w-full overflow-hidden text-ellipsis">
                {consumidor.login_copel || <span className="text-gray-400 italic">Não informado</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Senha de Acesso</p>
              <div className="flex items-center gap-3">
                <div className="font-mono bg-slate-50 px-4 py-2 rounded-lg text-gray-900 border border-gray-200 font-bold flex-1 overflow-hidden text-ellipsis">
                  {consumidor.senha_copel ? (showSenha ? consumidor.senha_copel : '••••••••••••') : <span className="text-gray-400 italic">Não informada</span>}
                </div>
                {consumidor.senha_copel && (
                  <button
                    onClick={() => setShowSenha(!showSenha)}
                    className="p-2 bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                    title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- LISTA DE FILIAIS / UCs --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" /> Unidades Consumidoras (UCs)
          </h3>
          <button onClick={() => setShowModalUC(true)} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 flex items-center gap-2 transition-colors shadow-sm shadow-purple-200">
            <Plus className="w-4 h-4" /> Nova UC
          </button>
        </div>

        {unidades.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 ">Nenhuma unidade cadastrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg border-y border-l border-gray-200">Nº da UC</th>
                  <th className="px-4 py-3 border-y border-gray-200">Endereço / Local</th>
                  <th className="px-4 py-3 border-y border-gray-200">Cidade</th>
                  <th className="px-4 py-3 border-y border-gray-200 text-right">Consumo Médio</th>
                  <th className="px-4 py-3 rounded-r-lg border-y border-r border-gray-200 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unidades.map((uc) => (
                  <tr key={uc.id} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="px-4 py-4 font-bold text-gray-900">{uc.codigo_uc}</td>
                    <td className="px-4 py-4 text-gray-500">{uc.endereco} - {uc.bairro}</td>
                    <td className="px-4 py-4 text-gray-500">{uc.cidade}/{uc.uf}</td>
                    <td className="px-4 py-4 text-right text-gray-900 font-medium">{uc.media_consumo} kWh</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setUcParaExcluir(uc.id)}
                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir UC"
                      >
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
      {showModalUC && createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-slate-100">
            <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
              <Building2 className="text-purple-600" /> Adicionar Nova UC
            </h3>
            <form onSubmit={handleSaveUC} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número da UC (Copel)</label>
                <input required type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-slate-900 transition-all"
                  value={formUC.codigo_uc} onChange={e => setFormUC({ ...formUC, codigo_uc: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Média de Consumo (kWh)</label>
                <input type="number" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  value={formUC.media_consumo} onChange={e => setFormUC({ ...formUC, media_consumo: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço / Identificação</label>
                <input required type="text" placeholder="Ex: Av Brasil, 100 - Filial Centro" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  value={formUC.endereco} onChange={e => setFormUC({ ...formUC, endereco: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bairro</label>
                  <input type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={formUC.bairro} onChange={e => setFormUC({ ...formUC, bairro: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <input type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={formUC.cidade} onChange={e => setFormUC({ ...formUC, cidade: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowModalUC(false)} className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-md shadow-purple-200 active:scale-95">Salvar UC</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão do Consumidor */}
      <ModalConfirmacao
        isOpen={modalExcluirOpen}
        onClose={() => setModalExcluirOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Consumidor"
        message="Tem certeza que deseja excluir este consumidor? Esta ação não pode ser desfeita."
        isDestructive={true}
        confirmText="Sim, Excluir"
      />

      {/* Modal de Confirmação de Exclusão da UC */}
      <ModalConfirmacao
        isOpen={ucParaExcluir !== null}
        onClose={() => setUcParaExcluir(null)}
        onConfirm={confirmarExclusaoUC}
        title="Excluir Unidade Consumidora"
        message="Tem certeza que deseja excluir esta UC? Se ela estiver vinculada a um rateio, os cálculos serão afetados."
        isDestructive={true}
        confirmText="Sim, Excluir UC"
      />

    </div>
  );
}
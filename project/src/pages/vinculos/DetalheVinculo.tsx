import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, FileText, Upload, Trash2, DollarSign, Calendar } from 'lucide-react';

interface Fechamento {
  fechamentoid: number;
  mesreferencia: string;
  energiacompensada: number;
  valorrecebido: number;
  valorpago: number;
  spread: number;
  arquivourl?: string;
  recibourl?: string;
}

interface VinculoDetalhado {
  id: number;
  Percentual: number;
  Observacao: string;
  DataInicio: string;
  status_nome: string;
  // Objetos aninhados que vêm do backend
  consumidor?: {
    Nome: string;
    Documento: string;
  };
  usina?: {
    NomeProprietario: string;
    Nome: string;
  };
  status?: {
    Descricao: string;
  };
}

export default function DetalheVinculo() {
  const { id } = useParams();
  const [vinculo, setVinculo] = useState<VinculoDetalhado | null>(null);
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o formulário de novo fechamento
  const [showForm, setShowForm] = useState(false);
  const [novoFechamento, setNovoFechamento] = useState({
    mesreferencia: '',
    energiacompensada: '',
    valorrecebido: '',
    valorpago: '',
    spread: ''
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Busca o vínculo pelo ID
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);

      // Tenta buscar fechamentos (se a rota existir)
      try {
        const dadosFechamentos = await api.fechamentos.list(Number(id));
        setFechamentos(dadosFechamentos || []);
      } catch (e) {
        console.warn("Rota de fechamentos ainda não configurada ou vazia.");
        setFechamentos([]);
      }

    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar os detalhes do vínculo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const handleSalvarFechamento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.fechamentos.create({
        VinculoID: Number(id),
        MesReferencia: novoFechamento.mesreferencia,
        EnergiaCompensada: Number(novoFechamento.energiacompensada),
        ValorRecebido: Number(novoFechamento.valorrecebido),
        ValorPago: Number(novoFechamento.valorpago),
        Spread: Number(novoFechamento.spread),
        ArquivoURL: '', // Futuro upload
        ReciboURL: ''   // Futuro upload
      });
      setShowForm(false);
      setNovoFechamento({ mesreferencia: '', energiacompensada: '', valorrecebido: '', valorpago: '', spread: '' });
      carregarDados();
    } catch (error) {
      alert('Erro ao salvar fechamento. Verifique se a tabela "fechamentos" foi criada no banco.');
    }
  };

  const handleExcluirFechamento = async (fechamentoId: number) => {
    if (confirm('Excluir este fechamento?')) {
      try {
        await api.fechamentos.delete(fechamentoId);
        carregarDados();
      } catch (e) { alert('Erro ao excluir'); }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando detalhes...</div>;
  if (!vinculo) return <div className="p-8 text-center text-red-500">Vínculo não encontrado.</div>;

  // Lógica segura para exibir os nomes (lê do objeto aninhado ou tenta fallback)
  const nomeConsumidor = vinculo.consumidor?.Nome || 'N/A';
  const nomeUsina = vinculo.usina?.NomeProprietario || vinculo.usina?.Nome || 'N/A';
  const statusDesc = vinculo.status?.Descricao || 'N/A';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link to="/vinculos" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Detalhes do Vínculo #{vinculo.id}</h1>
          <p className="text-gray-500">Gerencie os fechamentos e recibos deste contrato.</p>
        </div>
      </div>

      {/* Card de Informações Principais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Consumidor</h3>
          <p className="text-lg font-semibold text-gray-900 mt-1">{nomeConsumidor}</p>
          {vinculo.consumidor?.Documento && <span className="text-xs text-gray-400">{vinculo.consumidor.Documento}</span>}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Usina</h3>
          <p className="text-lg font-semibold text-gray-900 mt-1">{nomeUsina}</p>
          <p className="text-sm text-gray-500">Percentual: {vinculo.Percentual}%</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase">Status</h3>
          <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-medium
            ${statusDesc.includes('Ativo') || statusDesc.includes('compensação') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {statusDesc}
          </span>
          <p className="text-xs text-gray-400 mt-2">Início: {vinculo.DataInicio ? new Date(vinculo.DataInicio).toLocaleDateString() : '-'}</p>
        </div>
      </div>

      {/* Seção de Fechamentos Mensais */}
      <div className="flex justify-between items-center mt-8">
        <h2 className="text-xl font-bold text-gray-800">Fechamentos Mensais</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <DollarSign size={18} /> Adicionar Mês
        </button>
      </div>

      {/* Formulário de Adição */}
      {showForm && (
        <form onSubmit={handleSalvarFechamento} className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Mês (Data)</label>
            <input required type="date" className="w-full border rounded p-2" value={novoFechamento.mesreferencia} onChange={e => setNovoFechamento({...novoFechamento, mesreferencia: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Energia (kWh)</label>
            <input required type="number" placeholder="0" className="w-full border rounded p-2" value={novoFechamento.energiacompensada} onChange={e => setNovoFechamento({...novoFechamento, energiacompensada: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Recebido (R$)</label>
            <input required type="number" step="0.01" placeholder="0.00" className="w-full border rounded p-2" value={novoFechamento.valorrecebido} onChange={e => setNovoFechamento({...novoFechamento, valorrecebido: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Pago (R$)</label>
            <input required type="number" step="0.01" placeholder="0.00" className="w-full border rounded p-2" value={novoFechamento.valorpago} onChange={e => setNovoFechamento({...novoFechamento, valorpago: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Spread (R$)</label>
            <input required type="number" step="0.01" placeholder="0.00" className="w-full border rounded p-2" value={novoFechamento.spread} onChange={e => setNovoFechamento({...novoFechamento, spread: e.target.value})} />
          </div>
          <div className="md:col-span-1 flex gap-2">
            <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400">X</button>
          </div>
        </form>
      )}

      {/* Lista de Fechamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Mês</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Energia</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Recebido</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Pago</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Lucro (Spread)</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fechamentos.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum fechamento registrado para este vínculo.</td></tr>
            ) : (
              fechamentos.map((f) => (
                <tr key={f.fechamentoid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                  <td className="px-6 py-4">{f.energiacompensada} kWh</td>
                  <td className="px-6 py-4 text-green-600">R$ {f.valorrecebido?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-red-600">R$ {f.valorpago?.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">R$ {f.spread?.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-3">
                    <button className="text-gray-400 hover:text-blue-600" title="Ver Recibo"><FileText size={18} /></button>
                    <button className="text-gray-400 hover:text-blue-600" title="Upload"><Upload size={18} /></button>
                    <button onClick={() => handleExcluirFechamento(f.fechamentoid)} className="text-gray-400 hover:text-red-600" title="Excluir"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
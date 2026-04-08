import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calculator, Activity, Save, FolderOpen, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { pdf } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';
import { RelatorioSimulacaoPDF } from './RelatorioSimulacaoPDF';

interface MesSimulacao {
  id: string;
  mes: string;
  geracao: string;
  geracao_propria: string;
  consumo: string;
}

export default function SimuladorViabilidade() {
  const [titulo, setTitulo] = useState('Estudo de Viabilidade Comercial');
  const [clienteAvulso, setClienteAvulso] = useState('');
  const [usinaAvulsa, setUsinaAvulsa] = useState('');

  const [temGeracaoPropria, setTemGeracaoPropria] = useState(false);

  const [meses, setMeses] = useState<MesSimulacao[]>([
    { id: Math.random().toString(36), mes: '', geracao: '', geracao_propria: '', consumo: '' }
  ]);

  const [listaSalvas, setListaSalvas] = useState<any[]>([]);
  const [simulacaoAtualId, setSimulacaoAtualId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGerandoPDF, setIsGerandoPDF] = useState(false);

  const [listaUsinas, setListaUsinas] = useState<any[]>([]);
  const [listaConsumidores, setListaConsumidores] = useState<any[]>([]);

  const [tipoConsumidor, setTipoConsumidor] = useState<'sistema' | 'avulso'>('sistema');
  const [tipoUsina, setTipoUsina] = useState<'sistema' | 'avulso'>('sistema');

  const [consumidorId, setConsumidorId] = useState<number | ''>('');
  const [usinaId, setUsinaId] = useState<number | ''>('');

  useEffect(() => {
    carregarListaSalvas();
    carregarCadastrosOficiais();
  }, []);

  const carregarCadastrosOficiais = async () => {
    try {
      const [dadosUsinas, dadosConsumidores] = await Promise.all([
        api.usinas.list(),
        api.consumidores.list()
      ]);
      setListaUsinas(dadosUsinas || []);
      setListaConsumidores(dadosConsumidores || []);
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
    }
  };

  const carregarListaSalvas = async () => {
    try {
      const data = await api.simulacoes.list();
      setListaSalvas(data || []);
    } catch (error) {
      console.error("Erro ao carregar lista de simulações:", error);
    }
  };

  const preencherDadosHistoricos = (tipo: 'consumidor' | 'usina', idSelecionado: number) => {
    if (!idSelecionado) return;

    const estudosComEssaEntidade = listaSalvas.filter(sim =>
      tipo === 'consumidor' ? sim.consumidor_id === idSelecionado : sim.usina_id === idSelecionado
    );

    const ultimoEstudo = estudosComEssaEntidade[0];

    if (ultimoEstudo && ultimoEstudo.dados_mensais && ultimoEstudo.dados_mensais.length > 0) {
      toast.success(`Histórico de ${tipo === 'consumidor' ? 'consumo' : 'geração'} encontrado e preenchido!`);

      setMeses(mesesAtuais => {
        const mapaMeses = new Map(mesesAtuais.map(m => [m.mes, { ...m }]));
        let ligarChavinha = false;

        ultimoEstudo.dados_mensais.forEach((dadoHistorico: any) => {
          if (!dadoHistorico.mes) return;
          
          if (Number(dadoHistorico.geracao_propria) > 0) {
            ligarChavinha = true;
          }

          const mesExistente = mapaMeses.get(dadoHistorico.mes);

          if (mesExistente) {
            if (tipo === 'consumidor') {
              mesExistente.consumo = String(dadoHistorico.consumo || '');
              mesExistente.geracao_propria = String(dadoHistorico.geracao_propria || '');
            } else {
              mesExistente.geracao = String(dadoHistorico.geracao || '');
            }
            mapaMeses.set(dadoHistorico.mes, mesExistente);
          } else {
            mapaMeses.set(dadoHistorico.mes, {
              id: Math.random().toString(36),
              mes: dadoHistorico.mes,
              geracao: tipo === 'usina' ? String(dadoHistorico.geracao || '') : '',
              geracao_propria: tipo === 'consumidor' ? String(dadoHistorico.geracao_propria || '') : '',
              consumo: tipo === 'consumidor' ? String(dadoHistorico.consumo || '') : ''
            });
          }
        });

        if (ligarChavinha) setTemGeracaoPropria(true);

        const novaLista = Array.from(mapaMeses.values()).sort((a, b) => a.mes.localeCompare(b.mes));
        return novaLista.filter(m => m.mes !== '' || novaLista.length === 1);
      });
    }
  };

  const handleSelecionarSimulacao = async (idStr: string) => {
    if (!idStr) {
      setSimulacaoAtualId(null);
      setTitulo('Estudo de Viabilidade Comercial');
      setClienteAvulso('');
      setUsinaAvulsa('');
      setConsumidorId('');
      setUsinaId('');
      setTipoConsumidor('sistema');
      setTipoUsina('sistema');
      setTemGeracaoPropria(false);
      setMeses([{ id: Math.random().toString(36), mes: '', geracao: '', geracao_propria: '', consumo: '' }]);
      return;
    }

    try {
      const toastId = toast.loading('Carregando dados...');
      const id = Number(idStr);
      const data = await api.simulacoes.get(id);

      setSimulacaoAtualId(data.id);
      setTitulo(data.titulo_simulacao || '');

      if (data.consumidor_id) {
        setTipoConsumidor('sistema'); setConsumidorId(data.consumidor_id); setClienteAvulso('');
      } else {
        setTipoConsumidor('avulso'); setConsumidorId(''); setClienteAvulso(data.cliente_avulso || '');
      }

      if (data.usina_id) {
        setTipoUsina('sistema'); setUsinaId(data.usina_id); setUsinaAvulsa('');
      } else {
        setTipoUsina('avulso'); setUsinaId(''); setUsinaAvulsa(data.usina_avulsa || '');
      }

      if (data.dados_mensais && data.dados_mensais.length > 0) {
        let temPropriaBanco = false;
        const mesesDoBanco = data.dados_mensais.map((m: any) => {
          if (Number(m.geracao_propria) > 0) temPropriaBanco = true;
          return {
            id: Math.random().toString(36),
            mes: m.mes || '',
            geracao: String(m.geracao || ''),
            geracao_propria: String(m.geracao_propria || ''),
            consumo: String(m.consumo || '')
          };
        });
        setMeses(mesesDoBanco);
        setTemGeracaoPropria(temPropriaBanco);
      }

      toast.success('Simulação carregada!', { id: toastId });
    } catch (error) {
      toast.error('Erro ao carregar simulação.');
    }
  };

  const handleSalvar = async () => {
    if (!titulo) {
      toast.error('Dê um título para a simulação antes de salvar.');
      return;
    }

    try {
      setIsSaving(true);
      const toastId = toast.loading('Salvando projeção...');

      const dadosMensaisParaSalvar = meses.map(m => ({
        mes: m.mes,
        geracao: Number(m.geracao) || 0,
        geracao_propria: temGeracaoPropria ? (Number(m.geracao_propria) || 0) : 0,
        consumo: Number(m.consumo) || 0
      }));

      const payload = {
        titulo_simulacao: titulo,
        cliente_avulso: tipoConsumidor === 'avulso' ? clienteAvulso : null,
        usina_avulsa: tipoUsina === 'avulso' ? usinaAvulsa : null,
        consumidor_id: tipoConsumidor === 'sistema' ? (consumidorId || null) : null,
        usina_id: tipoUsina === 'sistema' ? (usinaId || null) : null,
        dados_mensais: dadosMensaisParaSalvar
      };

      if (simulacaoAtualId) {
        await api.simulacoes.update(simulacaoAtualId, payload);
        toast.success('Projeção atualizada com sucesso!', { id: toastId });
      } else {
        const novaSimulacao = await api.simulacoes.create(payload);
        setSimulacaoAtualId(novaSimulacao.id);
        toast.success('Projeção salva com sucesso!', { id: toastId });
      }

      carregarListaSalvas();
    } catch (error) {
      toast.error('Erro ao salvar projeção.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const handleExcluir = async () => {
    if (!simulacaoAtualId) return;

    try {
      const toastId = toast.loading('Excluindo...');
      await api.simulacoes.delete(simulacaoAtualId);
      toast.success('Estudo removido!', { id: toastId });

      handleSelecionarSimulacao('');
      carregarListaSalvas();
      setModalExcluirAberto(false);
    } catch (error) {
      toast.error('Erro ao excluir.');
    }
  };

  const dadosCalculados = useMemo(() => {
    let saldoAcumulado = 0;
    let totalGeradoUsinaNova = 0;
    let totalConsumido = 0;
    let totalGeracaoPropria = 0;

    const detalhado = meses.map(m => {
      const geracaoNova = Number(m.geracao) || 0;
      const consumo = Number(m.consumo) || 0;
      const geracaoPropria = temGeracaoPropria ? (Number(m.geracao_propria) || 0) : 0;
      
      const consumoResidual = consumo - geracaoPropria; 
      const balancoMes = geracaoNova - consumoResidual;

      saldoAcumulado += balancoMes;
      totalGeradoUsinaNova += geracaoNova;
      totalGeracaoPropria += geracaoPropria;
      totalConsumido += consumo;

      return {
        ...m,
        geracaoNum: geracaoNova,
        consumoNum: consumo,
        geracaoPropriaNum: geracaoPropria,
        consumoResidual,
        balancoMes,
        saldoAcumulado,
        mesGrafico: m.mes ? new Date(m.mes + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase() : '?'
      };
    });

    return { 
      detalhado, 
      saldoAcumulado, 
      totalGerado: totalGeradoUsinaNova, 
      totalConsumido, 
      totalGeracaoPropria,
      temGeracaoPropria 
    };
  }, [meses, temGeracaoPropria]);

  // 🟢 FUNÇÃO DA GAMBIARRA DO PDF COM GRÁFICO
  const handleGerarPDF = async () => {
    try {
      setIsGerandoPDF(true);
      const toastId = toast.loading('Preparando relatório com gráfico...');

      const elementoGrafico = document.getElementById('grafico-simulacao');
      let imgData = null;
      
      if (elementoGrafico) {
        const canvas = await html2canvas(elementoGrafico, { scale: 2, backgroundColor: '#ffffff' });
        imgData = canvas.toDataURL('image/png');
      }

      const doc = (
        <RelatorioSimulacaoPDF
          titulo={titulo}
          consumidorNome={nomeConsumidorImpresso}
          usinaNome={nomeUsinaImpressa}
          dadosCalculados={dadosCalculados}
          chartImage={imgData}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Simulacao_${titulo || 'Estudo'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('PDF gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar o PDF.');
    } finally {
      setIsGerandoPDF(false);
    }
  };

  const adicionarMes = () => {
    const ultimoMesPreenchido = meses[meses.length - 1]?.mes;
    let dataNovoMes = '';

    if (ultimoMesPreenchido) {
      let [ano, mesInt] = ultimoMesPreenchido.split('-').map(Number);
      mesInt -= 1;
      if (mesInt === 0) { mesInt = 12; ano -= 1; }
      const mesFormatado = String(mesInt).padStart(2, '0');
      dataNovoMes = `${ano}-${mesFormatado}`;
    }

    setMeses([...meses, { id: Math.random().toString(36), mes: dataNovoMes, geracao: '', geracao_propria: '', consumo: '' }]);
  };

  const removerMes = (idParaRemover: string) => {
    if (meses.length === 1) {
      toast.error('Você precisa de pelo menos um mês para simular!');
      return;
    }
    setMeses(meses.filter(m => m.id !== idParaRemover));
  };

  const atualizarMes = (id: string, campo: keyof MesSimulacao, valor: string) => {
    setMeses(meses.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const nomeConsumidorImpresso = tipoConsumidor === 'sistema'
    ? listaConsumidores.find(c => c.consumidor_id === consumidorId)?.nome || ''
    : clienteAvulso;

  const nomeUsinaImpressa = tipoUsina === 'sistema'
    ? listaUsinas.find(u => u.id === usinaId)?.nome || ''
    : usinaAvulsa;

  return (
    <div className="space-y-6 animate-fade-in-down max-w-6xl mx-auto pb-12">

      <div className="bg-gradient-to-r from-indigo-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Calculator className="text-indigo-400 w-8 h-8" />
            Simulador de Viabilidade
          </h2>
          <p className="text-slate-300 mt-2 opacity-90">Projete a geração e o consumo para criar relatórios comerciais precisos.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSalvar}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/50 disabled:opacity-50"
          >
            <Save size={20} /> {isSaving ? 'Salvando...' : (simulacaoAtualId ? 'Atualizar Projeção' : 'Salvar Projeção')}
          </button>

          <button
            onClick={handleGerarPDF}
            disabled={isGerandoPDF || isSaving}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/50 disabled:opacity-50"
          >
            <Download size={20} />
            {isGerandoPDF ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 min-w-max">
          <FolderOpen size={20} className="text-indigo-600" />
          <span className="font-bold text-slate-700">Abrir Estudo Salvo:</span>
        </div>
        <div className="flex gap-2 w-full">
          <select
            className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-indigo-900 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            value={simulacaoAtualId || ''}
            onChange={(e) => handleSelecionarSimulacao(e.target.value)}
          >
            <option value="">✨ Iniciar Nova Simulação (Em Branco)</option>
            {listaSalvas.map(sim => (
              <option key={sim.id} value={sim.id}>
                {sim.titulo_simulacao} {sim.cliente_avulso ? `(${sim.cliente_avulso})` : ''}
              </option>
            ))}
          </select>

          {simulacaoAtualId && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setModalExcluirAberto(true);
              }}
              className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 flex items-center justify-center"
              title="Excluir estudo permanentemente"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 border-b pb-2">Identificação do Estudo</h3>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Título da Simulação</label>
              <input type="text" className="w-full p-2 border rounded-lg bg-slate-50 mt-1"
                value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>

            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase">Consumidor (Consumo)</label>
                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                  <button onClick={() => setTipoConsumidor('sistema')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${tipoConsumidor === 'sistema' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Sistema</button>
                  <button onClick={() => setTipoConsumidor('avulso')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${tipoConsumidor === 'avulso' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Avulso</button>
                </div>
              </div>

              {tipoConsumidor === 'sistema' ? (
                <select
                  className="w-full p-2 border rounded-lg bg-white"
                  value={consumidorId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setConsumidorId(id);
                    preencherDadosHistoricos('consumidor', id);
                  }}
                >
                  <option value="">Selecione um Consumidor...</option>
                  {listaConsumidores.map(c => <option key={c.consumidor_id} value={c.consumidor_id}>{c.nome}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full p-2 border rounded-lg bg-white" placeholder="Nome do consumidor não cadastrado..." value={clienteAvulso} onChange={e => setClienteAvulso(e.target.value)} />
              )}
            </div>

            <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase">Usina (Geração)</label>
                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                  <button onClick={() => setTipoUsina('sistema')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${tipoUsina === 'sistema' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Sistema</button>
                  <button onClick={() => setTipoUsina('avulso')} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${tipoUsina === 'avulso' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}>Avulso</button>
                </div>
              </div>

              {tipoUsina === 'sistema' ? (
                <select
                  className="w-full p-2 border rounded-lg bg-white"
                  value={usinaId}
                  onChange={e => {
                    const id = Number(e.target.value);
                    setUsinaId(id);
                    preencherDadosHistoricos('usina', id);
                  }}
                >
                  <option value="">Selecione uma Usina...</option>
                  {listaUsinas.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              ) : (
                <input type="text" className="w-full p-2 border rounded-lg bg-white" placeholder="Nome da usina não cadastrada..." value={usinaAvulsa} onChange={e => setUsinaAvulsa(e.target.value)} />
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2 flex-wrap gap-2">
              <h3 className="font-bold text-slate-800">Lançamento de Meses</h3>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                    checked={temGeracaoPropria}
                    onChange={(e) => setTemGeracaoPropria(e.target.checked)}
                  />
                  Possui Geração
                </label>

                <button onClick={adicionarMes} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-100">
                  <Plus size={12} /> Add Mês
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {meses.map((mes, index) => (
                <div key={mes.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl relative group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Mês {index + 1}</span>
                    <button onClick={() => removerMes(mes.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                  </div>

                  <div className="space-y-2">
                    <input type="month" className="w-full p-2 text-sm border rounded bg-white"
                      value={mes.mes} onChange={e => atualizarMes(mes.id, 'mes', e.target.value)} />

                    <div className={`grid gap-2 ${temGeracaoPropria ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      <div>
                        <label className="text-[9px] font-bold text-orange-600 uppercase">Consumo (-)</label>
                        <input type="number" className="w-full p-1.5 text-xs border-orange-200 bg-orange-50/50 rounded font-bold text-orange-700" placeholder="0"
                          value={mes.consumo} onChange={e => atualizarMes(mes.id, 'consumo', e.target.value)} />
                      </div>

                      {temGeracaoPropria && (
                        <div>
                          <label className="text-[9px] font-bold text-teal-600 uppercase">Geração Própria (-)</label>
                          <input type="number" className="w-full p-1.5 text-xs border-teal-200 bg-teal-50/50 rounded font-bold text-teal-700" placeholder="0"
                            value={mes.geracao_propria} onChange={e => atualizarMes(mes.id, 'geracao_propria', e.target.value)} />
                        </div>
                      )}

                      <div>
                        <label className="text-[9px] font-bold text-blue-600 uppercase">Usina (+)</label>
                        <input type="number" className="w-full p-1.5 text-xs border-blue-200 bg-blue-50/50 rounded font-bold text-blue-700" placeholder="0"
                          value={mes.geracao} onChange={e => atualizarMes(mes.id, 'geracao', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="lg:col-span-2 space-y-6">

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nova Geração Projetada</p>
              <p className="text-2xl font-black text-blue-600">{dadosCalculados.totalGerado.toLocaleString()} <span className="text-xs font-medium text-slate-400">kWh</span></p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Consumo Residual (Falta)</p>
              <p className="text-2xl font-black text-orange-600">
                {(dadosCalculados.totalConsumido - dadosCalculados.totalGeracaoPropria).toLocaleString()} <span className="text-xs font-medium text-slate-400">kWh</span>
              </p>
            </div>
            <div className={`p-4 rounded-xl border shadow-sm ${dadosCalculados.saldoAcumulado >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dadosCalculados.saldoAcumulado >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Saldo Final Acumulado</p>
              <p className={`text-2xl font-black ${dadosCalculados.saldoAcumulado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {dadosCalculados.saldoAcumulado > 0 ? '+' : ''}{dadosCalculados.saldoAcumulado.toLocaleString()} <span className="text-xs font-medium">kWh</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> Curva de Geração Nova vs Necessidade Real (O que falta)
            </h4>
            <div id="grafico-simulacao" className="h-64 w-full p-2 bg-white rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosCalculados.detalhado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="mesGrafico" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} formatter={(value: any, name: any) => [`${Number(value || 0).toLocaleString('pt-BR')} kWh`, String(name)]} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />

                  <Bar dataKey="geracaoNum" name="Usina (+)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  {temGeracaoPropria && (
                    <Bar dataKey="geracaoPropriaNum" name="Ger. Própria (-)" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  )}
                  <Bar dataKey="consumoResidual" name={temGeracaoPropria ? "O Que Falta (-)" : "Consumo (-)"} fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="font-bold text-slate-800">Jornada do Banco de Créditos (Passo a Passo)</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-3">Mês</th>
                    <th className="p-3 text-right">Consumo</th>
                    {temGeracaoPropria && <th className="p-3 text-right text-teal-600">Geração Própria</th>}
                    {temGeracaoPropria && <th className="p-3 text-right text-orange-600">O Que Falta</th>}
                    <th className="p-3 text-right text-blue-600">Usina</th>
                    <th className="p-3 text-center">Balanço do Mês</th>
                    <th className="p-3 text-right">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dadosCalculados.detalhado.map((linha, i) => (
                    <tr key={linha.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-700 text-xs">{linha.mesGrafico !== '?' ? linha.mesGrafico : `Mês ${i + 1}`}</td>

                      <td className="p-3 text-right text-slate-600 font-medium">{linha.consumoNum.toLocaleString()}</td>

                      {temGeracaoPropria && (
                        <td className="p-3 text-right text-teal-600 font-medium">- {linha.geracaoPropriaNum.toLocaleString()}</td>
                      )}

                      {temGeracaoPropria && (
                        <td className="p-3 text-right text-orange-600 font-bold">{linha.consumoResidual.toLocaleString()}</td>
                      )}

                      <td className="p-3 text-right text-blue-600 font-black">{linha.geracaoNum.toLocaleString()}</td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-widest ${linha.balancoMes >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {linha.balancoMes > 0 ? '+' : ''}{linha.balancoMes.toLocaleString()}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-black ${linha.saldoAcumulado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {linha.saldoAcumulado.toLocaleString()} kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`p-5 text-center border-t ${dadosCalculados.saldoAcumulado >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <span className={`text-lg font-black tracking-wide uppercase ${dadosCalculados.saldoAcumulado >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Veredito da Ampliação ({meses.length} meses):
                {dadosCalculados.saldoAcumulado >= 0
                  ? ` SOBROU +${dadosCalculados.saldoAcumulado.toLocaleString()} kWh`
                  : ` FALTOU ${Math.abs(dadosCalculados.saldoAcumulado).toLocaleString()} kWh`
                }
              </span>
              <p className={`text-xs mt-1 font-bold ${dadosCalculados.saldoAcumulado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {dadosCalculados.saldoAcumulado >= 0
                  ? 'A Usina Nova cobriu 100% do que faltava na conta do cliente.'
                  : 'A Usina Nova não foi suficiente para cobrir o déficit atual. O cliente ainda pagará concessionária.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {modalExcluirAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in-down border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Excluir Estudo</h3>
                <p className="text-sm font-bold text-slate-500">Essa ação é permanente.</p>
              </div>
            </div>

            <p className="text-slate-600 mb-6 font-medium">
              Tem certeza que deseja excluir o estudo <span className="font-bold text-slate-900">"{titulo}"</span>? Você não poderá recuperá-lo depois.
            </p>

            <div className="flex gap-3 justify-end mt-4">
              <button
                onClick={() => setModalExcluirAberto(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluir}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-all shadow-lg shadow-red-500/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
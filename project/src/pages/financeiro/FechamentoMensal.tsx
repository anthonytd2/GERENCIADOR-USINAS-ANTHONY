import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Calculator, Save, CheckCircle, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast'; // Sugestão: Usar toast em vez de alert

export default function FechamentoMensal() {
    const [loading, setLoading] = useState(true);
    const [calculando, setCalculando] = useState(false); // Estado separado para o botão de calcular
    const [step, setStep] = useState(1);

    // Listas
    const [usinas, setUsinas] = useState<any[]>([]);

    // Seleções
    const [usinaSelecionada, setUsinaSelecionada] = useState<any>(null);
    const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));

    // Inputs da Usina
    const [dadosUsina, setDadosUsina] = useState({
        leituraAnterior: '',
        leituraAtual: '',
        energiaCompensadaPropria: '0',
        valorFioB: '0.071',
        valorFaturaGeradora: '0'
    });

    const [dadosConsumidores, setDadosConsumidores] = useState<any[]>([]);
    const [resultado, setResultado] = useState<any>(null);

    useEffect(() => { loadUsinas(); }, []);

    async function loadUsinas() {
        try {
            const lista = await api.usinas.list();
            setUsinas(lista || []);
        } catch (error) {
            toast.error('Erro ao carregar usinas');
        } finally {
            setLoading(false);
        }
    }

    const handleSelectUsina = async (usinaId: string) => {
        if (!usinaId) {
            setUsinaSelecionada(null);
            setStep(1);
            return;
        }

        // Busca pelo ID padronizado (ou legado)
        const usina = usinas.find(u => String(u.id) === String(usinaId) || String(u.usinaid) === String(usinaId));
        setUsinaSelecionada(usina);

        // Resetar estados
        setDadosUsina(prev => ({ ...prev, leituraAnterior: '', leituraAtual: '' }));
        setDadosConsumidores([]);
        setResultado(null);
        setStep(2);

        // Se for usina de Rateio (Consumo), busca os clientes
        if (usina && (usina.tipo_remuneracao === 'energia_consumida' || usina.tipo_pagamento === 'CONSUMO')) {
            try {
                const todosVinculos = await api.vinculos.list();
                // Filtra vínculos desta usina
                const vinculados = todosVinculos.filter((v: any) => 
                    String(v.usina_id) === String(usina.id) || String(v.usinaid) === String(usina.id)
                );

                const inputsIniciais = vinculados.map((v: any) => ({
                    id: v.consumidor_id || v.consumidorid, // ID do Consumidor
                    nome: v.nome_consumidor || v.consumidor_nome || 'Cliente',
                    consumo: '',
                    energiaCompensada: '',
                    valorPagoFatura: ''
                }));
                setDadosConsumidores(inputsIniciais);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao carregar clientes vinculados.");
            }
        }
    };

    const handleSimular = async () => {
        // Validação básica
        if (!dadosUsina.leituraAtual || !dadosUsina.leituraAnterior) {
            return toast.error("Preencha as leituras do medidor.");
        }

        try {
            setCalculando(true);
            const payload = {
                usinaId: usinaSelecionada.id || usinaSelecionada.usinaid,
                mesReferencia: `${mesReferencia}-01`,
                leituras: dadosUsina,
                consumidores: dadosConsumidores
            };

            // Usando api.client (se existir) ou axios direto
            // Nota: Verifique se sua api exporta 'client' ou se tem um método específico
            // Se der erro aqui, troque por: axios.post('http://localhost:3000/api/fechamentos/simular', ...)
            const { data: res } = await api.client.post('/fechamentos/simular', payload);
            
            setResultado(res);
            setStep(3);
            toast.success("Cálculo realizado!");
        } catch (error) {
            toast.error('Erro ao simular valores.');
            console.error(error);
        } finally {
            setCalculando(false);
        }
    };

    const handleSalvar = async () => {
        if (!confirm("Confirmar fechamento? Isso gera registros financeiros no sistema.")) return;

        try {
            setLoading(true);
            const payload = {
                usinaId: usinaSelecionada.id || usinaSelecionada.usinaid,
                mesReferencia: `${mesReferencia}-01`,
                leituras: dadosUsina,
                consumidores: dadosConsumidores
            };

            await api.client.post('/fechamentos', payload);
            
            toast.success('Fechamento mensal salvo com sucesso!');
            
            // Reset Total
            setStep(1);
            setResultado(null);
            setUsinaSelecionada(null);
            setMesReferencia(new Date().toISOString().slice(0, 7)); // Reseta data para hoje
        } catch (error) {
            toast.error('Erro ao salvar fechamento.');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in-down">
            <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fechamento Mensal</h1>
                    <p className="text-gray-500 mt-1">Cálculo de repasse e faturamento de clientes.</p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
                        Passo {step} de 3
                    </span>
                </div>
            </div>

            {/* ETAPA 1: SELEÇÃO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 transition-all hover:shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mês de Referência</label>
                        <input type="month" value={mesReferencia} onChange={e => setMesReferencia(e.target.value)} 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Selecione a Usina</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                            onChange={e => handleSelectUsina(e.target.value)}
                            value={usinaSelecionada ? (usinaSelecionada.id || usinaSelecionada.usinaid) : ''}
                        >
                            <option value="">Selecione uma usina para iniciar...</option>
                            {usinas.map(u => (
                                <option key={u.id || u.usinaid} value={u.id || u.usinaid}>
                                    {u.nome} — {u.tipo_pagamento === 'INJETADO' ? '🟢 Injeção Pura' : '🔵 Consumo/Rateio'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {usinaSelecionada && step >= 2 && (
                <>
                    {/* ETAPA 2: DADOS DA USINA */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Search className="w-5 h-5 text-blue-500" />
                            Dados do Medidor (GD)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Leitura Anterior</label>
                                <input type="number" value={dadosUsina.leituraAnterior} 
                                    onChange={e => setDadosUsina({ ...dadosUsina, leituraAnterior: e.target.value })} 
                                    className="w-full p-3 border rounded-xl text-lg font-mono text-gray-600 focus:border-blue-500 outline-none" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Leitura Atual</label>
                                <input type="number" value={dadosUsina.leituraAtual} 
                                    onChange={e => setDadosUsina({ ...dadosUsina, leituraAtual: e.target.value })} 
                                    className="w-full p-3 border border-blue-200 bg-blue-50/30 rounded-xl text-lg font-mono text-blue-700 font-bold focus:border-blue-500 outline-none" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Fio B (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                    <input type="number" step="0.001" value={dadosUsina.valorFioB} 
                                        onChange={e => setDadosUsina({ ...dadosUsina, valorFioB: e.target.value })} 
                                        className="w-full pl-8 p-3 border rounded-xl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fatura Mínima (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">R$</span>
                                    <input type="number" step="0.01" value={dadosUsina.valorFaturaGeradora} 
                                        onChange={e => setDadosUsina({ ...dadosUsina, valorFaturaGeradora: e.target.value })} 
                                        className="w-full pl-8 p-3 border rounded-xl" />
                                </div>
                            </div>

                            {/* Campo Extra para Usina Injetada */}
                            {usinaSelecionada.tipo_pagamento === 'INJETADO' && (
                                <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <label className="block text-xs font-bold text-orange-700 uppercase mb-1">Consumo Próprio Instantâneo</label>
                                    <p className="text-[10px] text-orange-600 mb-2">Energia gerada e consumida na própria usina antes de passar pelo relógio.</p>
                                    <div className="relative">
                                        <input type="number" value={dadosUsina.energiaCompensadaPropria} 
                                            onChange={e => setDadosUsina({ ...dadosUsina, energiaCompensadaPropria: e.target.value })} 
                                            className="w-full p-3 border border-orange-200 rounded-xl font-bold text-orange-800" />
                                        <span className="absolute right-3 top-3 text-orange-400 text-sm font-bold">kWh</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ETAPA 3 (CONDICIONAL): DADOS DOS CONSUMIDORES */}
                    {(usinaSelecionada.tipo_remuneracao === 'energia_consumida' || usinaSelecionada.tipo_pagamento === 'CONSUMO') && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-purple-500" />
                                Dados das Faturas (Rateio)
                            </h2>
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Cliente / Unidade</th>
                                            <th className="p-4 w-40">Consumo (kWh)</th>
                                            <th className="p-4 w-40">Compensado (kWh)</th>
                                            <th className="p-4 w-40">Valor Fatura (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {dadosConsumidores.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-400">Nenhum consumidor vinculado encontrado.</td></tr>
                                        ) : (
                                            dadosConsumidores.map((cliente, index) => (
                                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 font-bold text-slate-700">{cliente.nome}</td>
                                                    <td className="p-4">
                                                        <input type="number" value={cliente.consumo}
                                                            onChange={e => {
                                                                const novos = [...dadosConsumidores];
                                                                novos[index].consumo = e.target.value;
                                                                setDadosConsumidores(novos);
                                                            }}
                                                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-center" placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <input type="number" value={cliente.energiaCompensada}
                                                            onChange={e => {
                                                                const novos = [...dadosConsumidores];
                                                                novos[index].energiaCompensada = e.target.value;
                                                                setDadosConsumidores(novos);
                                                            }}
                                                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-center" placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-2 text-gray-400 text-xs">R$</span>
                                                            <input type="number" step="0.01" value={cliente.valorPagoFatura}
                                                                onChange={e => {
                                                                    const novos = [...dadosConsumidores];
                                                                    novos[index].valorPagoFatura = e.target.value;
                                                                    setDadosConsumidores(novos);
                                                                }}
                                                                className="w-full pl-6 p-2 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" placeholder="0,00"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BOTÃO SIMULAR */}
                    <div className="flex justify-end mb-10">
                        <button 
                            onClick={handleSimular} 
                            disabled={calculando} 
                            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-3 shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            {calculando ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                            {calculando ? 'Calculando Cenários...' : 'Simular Fechamento'}
                        </button>
                    </div>
                </>
            )}

            {/* ETAPA 4: RESULTADOS E SALVAR */}
            {resultado && (
                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl animate-fade-in-up mb-20 border border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <CheckCircle className="text-emerald-400 w-8 h-8" /> 
                                Resultado da Simulação
                            </h2>
                            <p className="text-slate-400 text-sm mt-1 ml-11">Valores calculados com base nas regras de rateio.</p>
                        </div>
                        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400 text-xs uppercase font-bold">Mês Ref:</span>
                            <span className="ml-2 font-mono font-bold text-white">{mesReferencia}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* CARD 1: PRODUÇÃO */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Geração Total</p>
                            </div>
                            <h3 className="text-3xl font-black text-yellow-400 truncate">
                                {(resultado.energiaInjetada || resultado.producaoTotal || 0).toLocaleString()} <span className="text-lg text-yellow-400/50">kWh</span>
                            </h3>
                        </div>

                        {/* CARD 2: PAGAR USINA */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Custo Gerador</p>
                            </div>
                            <h3 className="text-3xl font-black text-red-400 truncate">
                                {fmt(resultado.totalPagarGerador)}
                            </h3>
                        </div>

                        {/* CARD 3: RECEITA */}
                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Calculator size={64} className="text-white" />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Receita Líquida</p>
                            </div>
                            <h3 className="text-3xl font-black text-emerald-400 truncate">
                                {fmt(resultado.receitaBionova || resultado.totalReceitaBionova || 0)}
                            </h3>
                        </div>
                    </div>

                    {/* TABELA DE DETALHES */}
                    {resultado.detalhesConsumidores && resultado.detalhesConsumidores.length > 0 && (
                        <div className="bg-white text-slate-900 rounded-xl overflow-hidden mb-8 shadow-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 font-bold text-slate-600 uppercase text-xs">
                                    <tr>
                                        <th className="p-4 text-left">Cliente</th>
                                        <th className="p-4 text-right">Economia Bruta</th>
                                        <th className="p-4 text-right bg-emerald-50 text-emerald-800">A Cobrar (Bionova)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {resultado.detalhesConsumidores.map((c: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold">{c.nome}</td>
                                            <td className="p-4 text-right font-mono text-slate-600">{fmt(c.economiaBruta)}</td>
                                            <td className="p-4 text-right font-bold font-mono text-emerald-700 bg-emerald-50/30 border-l border-emerald-100">
                                                {fmt(c.valorBionova)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                        <button onClick={() => setResultado(null)} className="px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 text-slate-300 font-bold transition-colors">
                            Voltar e Ajustar
                        </button>
                        <button onClick={handleSalvar} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-all hover:scale-105 active:scale-95">
                            <Save className="w-5 h-5" />
                            Confirmar Fechamento Oficial
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Calculator, Save, CheckCircle, Search } from 'lucide-react';

export default function FechamentoMensal() {
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Seleção, 2: Dados, 3: Resultado

    // Listas
    const [usinas, setUsinas] = useState<any[]>([]);

    // Seleções
    const [usinaSelecionada, setUsinaSelecionada] = useState<any>(null);
    const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Inputs da Usina (Leituras)
    const [dadosUsina, setDadosUsina] = useState({
        leituraAnterior: '',
        leituraAtual: '',
        energiaCompensadaPropria: '0',
        valorFioB: '0.071',
        valorFaturaGeradora: '0'
    });

    // Inputs dos Consumidores (Apenas para Usinas de Consumo)
    const [dadosConsumidores, setDadosConsumidores] = useState<any[]>([]);

    // Resultado da Simulação
    const [resultado, setResultado] = useState<any>(null);

    useEffect(() => {
        loadUsinas();
    }, []);

    async function loadUsinas() {
        try {
            const lista = await api.usinas.list();
            setUsinas(lista);
        } catch (error) {
            alert('Erro ao carregar usinas');
        } finally {
            setLoading(false);
        }
    }

    // Quando seleciona a usina, busca os vínculos (clientes)
    const handleSelectUsina = async (usinaId: string) => {
        const usina = usinas.find(u => u.usinaid === Number(usinaId) || u.id === Number(usinaId));
        setUsinaSelecionada(usina);

        // Reseta dados
        setDadosUsina(prev => ({ ...prev, leituraAnterior: '', leituraAtual: '' }));
        setDadosConsumidores([]);
        setResultado(null);
        setStep(2);

        if (usina && usina.tipo_remuneracao === 'energia_consumida') {
            // Busca consumidores vinculados a esta usina
            try {
                const todosVinculos = await api.vinculos.list();
                // Filtra apenas os dessa usina
                const vinculados = todosVinculos.filter((v: any) => v.usinaid === usina.usinaid || v.usina_id === usina.id);

                // Prepara o array de inputs para cada consumidor
                const inputsIniciais = vinculados.map((v: any) => ({
                    id: v.consumidorid || v.consumidor_id,
                    nome: v.nome_consumidor || 'Cliente',
                    consumo: '',
                    energiaCompensada: '',
                    valorPagoFatura: ''
                }));
                setDadosConsumidores(inputsIniciais);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSimular = async () => {
        try {
            setLoading(true);
            const payload = {
                usinaId: usinaSelecionada.usinaid || usinaSelecionada.id,
                mesReferencia: `${mesReferencia}-01`,
                leituras: dadosUsina,
                consumidores: dadosConsumidores
            };


            // CORRETO
            const { data: res } = await api.client.post('/fechamentos/simular', payload);
            setResultado(res);
            setStep(3);
        } catch (error) {
            alert('Erro ao simular');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async () => {
        if (!confirm("Tem certeza que deseja fechar o mês? Isso vai gerar os registros financeiros.")) return;

        try {
            setLoading(true);
            const payload = {
                usinaId: usinaSelecionada.usinaid || usinaSelecionada.id,
                mesReferencia: `${mesReferencia}-01`,
                leituras: dadosUsina,
                consumidores: dadosConsumidores
            };

            // CORRETO
            await api.client.post('/fechamentos', payload);
            alert('Fechamento realizado com sucesso!');
            // Resetar
            setStep(1);
            setResultado(null);
            setUsinaSelecionada(null);
        } catch (error) {
            alert('Erro ao salvar fechamento');
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900">Fechamento Mensal</h1>
                <p className="text-gray-500 mt-1">Calcule o repasse da usina e a cobrança dos clientes</p>
            </div>

            {/* ETAPA 1: SELEÇÃO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mês de Referência</label>
                        <input type="month" value={mesReferencia} onChange={e => setMesReferencia(e.target.value)} className="w-full p-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Usina</label>
                        <select
                            className="w-full p-2 border rounded-lg"
                            onChange={e => handleSelectUsina(e.target.value)}
                            value={usinaSelecionada ? (usinaSelecionada.usinaid || usinaSelecionada.id) : ''}
                        >
                            <option value="">Selecione...</option>
                            {usinas.map(u => (
                                <option key={u.usinaid || u.id} value={u.usinaid || u.id}>
                                    {u.nomeproprietario || u.nome_proprietario} ({u.tipo_remuneracao === 'energia_injetada' ? 'Injeção' : 'Consumo'})
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
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Dados de Produção (Medidor)
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500">Leitura Anterior</label>
                                <input type="number" value={dadosUsina.leituraAnterior} onChange={e => setDadosUsina({ ...dadosUsina, leituraAnterior: e.target.value })} className="w-full p-2 border rounded text-lg font-mono" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Leitura Atual</label>
                                <input type="number" value={dadosUsina.leituraAtual} onChange={e => setDadosUsina({ ...dadosUsina, leituraAtual: e.target.value })} className="w-full p-2 border rounded text-lg font-mono text-blue-600" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Valor Fio B (R$)</label>
                                <input type="number" step="0.001" value={dadosUsina.valorFioB} onChange={e => setDadosUsina({ ...dadosUsina, valorFioB: e.target.value })} className="w-full p-2 border rounded" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500">Fatura Mínima Usina (R$)</label>
                                <input type="number" step="0.01" value={dadosUsina.valorFaturaGeradora} onChange={e => setDadosUsina({ ...dadosUsina, valorFaturaGeradora: e.target.value })} className="w-full p-2 border rounded" />
                            </div>

                            {usinaSelecionada.tipo_remuneracao === 'energia_injetada' && (
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-500">Consumo Próprio da Usina (Compensado nela mesma)</label>
                                    <input type="number" value={dadosUsina.energiaCompensadaPropria} onChange={e => setDadosUsina({ ...dadosUsina, energiaCompensadaPropria: e.target.value })} className="w-full p-2 border rounded" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ETAPA 3 (CONDICIONAL): DADOS DOS CONSUMIDORES */}
                    {usinaSelecionada.tipo_remuneracao === 'energia_consumida' && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-orange-600 mb-4">Dados dos Clientes (Rateio)</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="p-3">Cliente</th>
                                            <th className="p-3 w-32">Consumo (kWh)</th>
                                            <th className="p-3 w-32">Compensado (kWh)</th>
                                            <th className="p-3 w-32">Valor Fatura (R$)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dadosConsumidores.map((cliente, index) => (
                                            <tr key={cliente.id}>
                                                <td className="p-3 font-medium">{cliente.nome}</td>
                                                <td className="p-3">
                                                    <input type="number" value={cliente.consumo}
                                                        onChange={e => {
                                                            const novos = [...dadosConsumidores];
                                                            novos[index].consumo = e.target.value;
                                                            setDadosConsumidores(novos);
                                                        }}
                                                        className="w-full p-1 border rounded" placeholder="0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input type="number" value={cliente.energiaCompensada}
                                                        onChange={e => {
                                                            const novos = [...dadosConsumidores];
                                                            novos[index].energiaCompensada = e.target.value;
                                                            setDadosConsumidores(novos);
                                                        }}
                                                        className="w-full p-1 border rounded" placeholder="0"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input type="number" step="0.01" value={cliente.valorPagoFatura}
                                                        onChange={e => {
                                                            const novos = [...dadosConsumidores];
                                                            novos[index].valorPagoFatura = e.target.value;
                                                            setDadosConsumidores(novos);
                                                        }}
                                                        className="w-full p-1 border rounded" placeholder="R$ 0,00"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* BOTÃO SIMULAR */}
                    <div className="flex justify-end mb-8">
                        <button onClick={handleSimular} disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg disabled:opacity-50">
                            <Calculator className="w-5 h-5" />
                            {loading ? 'Calculando...' : 'Calcular Fechamento'}
                        </button>
                    </div>
                </>
            )}

            {/* ETAPA 4: RESULTADOS E SALVAR */}
            {resultado && (
                <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-2xl animate-fade-in mb-20">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className="text-green-400" /> Resultado do Fechamento
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-sm">Produção Total</p>
                            <h3 className="text-3xl font-bold text-yellow-400">
                                {(resultado.energiaInjetada || resultado.producaoTotal || 0).toLocaleString()} kWh
                            </h3>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-sm">Pagar ao Gerador (Usina)</p>
                            <h3 className="text-3xl font-bold text-red-400">
                                {fmt(resultado.totalPagarGerador)}
                            </h3>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-sm">Receita Bionova (Clientes)</p>
                            <h3 className="text-3xl font-bold text-green-400">
                                {fmt(resultado.receitaBionova || resultado.totalReceitaBionova || 0)}
                            </h3>
                        </div>
                    </div>

                    {resultado.detalhesConsumidores && (
                        <div className="bg-white text-slate-900 rounded-lg overflow-hidden mb-6">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-100 font-bold">
                                    <tr>
                                        <th className="p-3 text-left">Cliente</th>
                                        <th className="p-3 text-right">Economia Bruta</th>
                                        <th className="p-3 text-right">A Cobrar (Bionova)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {resultado.detalhesConsumidores.map((c: any, i: number) => (
                                        <tr key={i}>
                                            <td className="p-3">{c.nome}</td>
                                            <td className="p-3 text-right">{fmt(c.economiaBruta)}</td>
                                            <td className="p-3 text-right font-bold text-green-700">{fmt(c.valorBionova)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end gap-4">
                        <button onClick={() => setResultado(null)} className="px-6 py-3 border border-slate-600 rounded-lg hover:bg-slate-800 text-slate-300">
                            Voltar e Editar
                        </button>
                        <button onClick={handleSalvar} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-green-900/50">
                            <Save className="w-5 h-5" />
                            Confirmar e Salvar Mês
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
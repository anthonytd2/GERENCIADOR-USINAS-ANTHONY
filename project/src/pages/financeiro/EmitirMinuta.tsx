import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { FileText, User, Building, Search, FileDown, RefreshCw, Calculator, Save } from 'lucide-react';
import { gerarMinutaPDF } from '../../utils/gerarMinutaPDF';

export default function EmitirMinuta() {
  const [loading, setLoading] = useState(false);
  
  // Usamos 'any' aqui para aceitar qualquer nome de coluna que vier do banco
  const [listaConsumidores, setListaConsumidores] = useState<any[]>([]);
  const [listaUsinas, setListaUsinas] = useState<any[]>([]);

  // Estados de controle das abas
  const [modoConsumidor, setModoConsumidor] = useState<'buscar' | 'novo'>('buscar');
  const [modoUsina, setModoUsina] = useState<'buscar' | 'novo'>('buscar');

  const [form, setForm] = useState({
    consumidor_nome: '',
    consumidor_doc: '',
    consumidor_endereco: '',
    consumidor_inscricao: '',
    valor_recebido: '',
    
    gerador_nome: '',
    gerador_doc: '',
    valor_pago: '',
    
    data_emissao: new Date().toISOString().slice(0, 10),
  });

  const [resultado, setResultado] = useState({ spread: 0, margem: 0 });

  useEffect(() => { carregarDados(); }, []);

  // --- CÁLCULOS ---
  useEffect(() => {
    const recebido = Number(form.valor_recebido) || 0;
    const pago = Number(form.valor_pago) || 0;
    const spread = recebido - pago;
    const margem = recebido > 0 ? (spread / recebido) * 100 : 0;
    setResultado({ spread, margem });
  }, [form.valor_recebido, form.valor_pago]);

  // --- CARREGAR LISTAS ---
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [consumidores, usinas] = await Promise.all([
        api.consumidores.list(),
        api.usinas.list()
      ]);
      
      console.log("Consumidores carregados:", consumidores); // Para debug
      console.log("Usinas carregadas:", usinas); // Para debug

      setListaConsumidores(consumidores || []);
      setListaUsinas(usinas || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar listas.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE SELEÇÃO ROBUSTA (Tenta vários nomes de campo) ---
  const selecionarConsumidor = (idSelecionado: string) => {
    // Tenta encontrar pelo ID normal ou consumidor_id
    const selecionado = listaConsumidores.find(c => 
        String(c.id) === idSelecionado || String(c.consumidor_id) === idSelecionado
    );

    if (selecionado) {
      console.log("Consumidor Selecionado:", selecionado);
      
      setForm(prev => ({
        ...prev,
        // Tenta 'nome' ou 'razao_social'
        consumidor_nome: selecionado.nome || selecionado.razao_social || '',
        // Tenta 'cpf_cnpj', 'cpf', 'cnpj' ou 'cpf_cnpj'
        consumidor_doc: selecionado.cpf_cnpj || selecionado.cpf_cnpj || selecionado.cpf || selecionado.cnpj || '',
        // Tenta 'endereco' ou 'logradouro'
        consumidor_endereco: selecionado.endereco || selecionado.logradouro || '',
        // Tenta 'inscricao_estadual' ou 'ie'
        consumidor_inscricao: selecionado.inscricao_estadual || selecionado.ie || 'Isento'
      }));
      toast.success("Dados preenchidos!");
    }
  };

  const selecionarUsina = (idSelecionado: string) => {
    // Tenta encontrar pelo ID normal ou usina_id
    const selecionada = listaUsinas.find(u => 
        String(u.id) === idSelecionado || String(u.usina_id) === idSelecionado || String(u.usinaId) === idSelecionado
    );

    if (selecionada) {
      console.log("Usina Selecionada:", selecionada);

      setForm(prev => ({
        ...prev,
        // Tenta 'nome' ou 'proprietario'
        gerador_nome: selecionada.nome || selecionada.proprietario || '',
        // Tenta 'cpf_cnpj' ou 'cpf_cnpj'
        gerador_doc: selecionada.cpf_cnpj || selecionada.cpf_cnpj || ''
      }));
      toast.success("Dados preenchidos!");
    }
  };

  // --- SALVAR NOVO ---
  const salvarNovoConsumidor = async () => {
    if(!form.consumidor_nome) return toast.error("Preencha o nome");
    try {
        const toastId = toast.loading("Salvando...");
        await api.consumidores.create({
            nome: form.consumidor_nome,
            cpf_cnpj: form.consumidor_doc,
            endereco: form.consumidor_endereco,
            inscricao_estadual: form.consumidor_inscricao
        });
        await carregarDados();
        setModoConsumidor('buscar');
        toast.success("Salvo!", { id: toastId });
    } catch (error) {
        toast.error("Erro ao salvar.");
    }
  };

  const salvarNovaUsina = async () => {
    if(!form.gerador_nome) return toast.error("Preencha o nome");
    try {
        const toastId = toast.loading("Salvando...");
        await api.usinas.create({
            nome: form.gerador_nome,
            cpf_cnpj: form.gerador_doc,
            nome_usina: `Usina de ${form.gerador_nome}`,
            tipo: 'SOLAR',
            potencia: 0
        });
        await carregarDados();
        setModoUsina('buscar');
        toast.success("Salvo!", { id: toastId });
    } catch (error) {
        toast.error("Erro ao salvar.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGerarPDF = (e: React.FormEvent) => {
    e.preventDefault();
    gerarMinutaPDF(form, resultado);
  };

  return (
    <div className="space-y-6 animate-fade-in-down p-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" /> Emitir Relatório para Financeiro
          </h3>
          <p className="text-slate-300 text-sm mt-1 opacity-90">Preencha os dados e gere o PDF.</p>
        </div>
        <button onClick={carregarDados} className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600 transition-colors">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <form onSubmit={handleGerarPDF} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* === COLUNA ESQUERDA: CONSUMIDOR === */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-green-100 text-green-700 rounded-lg"><User size={20} /></div>
                <h4 className="font-bold text-gray-800">Dados do Tomador (Consumidor)</h4>
            </div>

            {/* ABAS */}
            <div className="flex gap-2 mb-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setModoConsumidor('buscar')} 
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${modoConsumidor === 'buscar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                    🔍 Buscar Cadastrado
                </button>
                <button type="button" onClick={() => setModoConsumidor('novo')} 
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${modoConsumidor === 'novo' ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}>
                    ➕ Novo Cadastro
                </button>
            </div>

            {modoConsumidor === 'buscar' ? (
                <div className="relative">
                    <select className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                        onChange={(e) => selecionarConsumidor(e.target.value)} defaultValue="">
                        <option value="" disabled>Selecione um cliente...</option>
                        {listaConsumidores.map((c: any) => (
                            // Tenta usar id ou consumidor_id como chave e valor
                            <option key={c.id || c.consumidor_id} value={c.id || c.consumidor_id}>
                                {c.nome || c.razao_social || 'Sem Nome'}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-xs text-green-800 mb-2">
                    Preencha abaixo para cadastrar.
                </div>
            )}

            {/* CAMPOS */}
            <div className="space-y-3">
                <input type="text" name="consumidor_nome" placeholder="Nome / Razão Social" required className="w-full p-3 border rounded-xl text-sm" value={form.consumidor_nome} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="consumidor_doc" placeholder="CPF / CNPJ" className="w-full p-3 border rounded-xl text-sm" value={form.consumidor_doc} onChange={handleChange} />
                    <input type="text" name="consumidor_inscricao" placeholder="Insc. Estadual" className="w-full p-3 border rounded-xl text-sm" value={form.consumidor_inscricao} onChange={handleChange} />
                </div>
                <input type="text" name="consumidor_endereco" placeholder="Endereço Completo" className="w-full p-3 border rounded-xl text-sm" value={form.consumidor_endereco} onChange={handleChange} />
                
                {modoConsumidor === 'novo' && (
                    <button type="button" onClick={salvarNovoConsumidor} className="w-full py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 flex items-center justify-center gap-2">
                        <Save size={14}/> Salvar no Banco
                    </button>
                )}
            </div>

            <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-green-700 uppercase mb-1">Valor Recebido</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-green-600 font-bold">R$</span>
                    <input type="number" name="valor_recebido" required className="w-full pl-10 p-3 border border-green-200 bg-green-50/50 rounded-xl font-bold text-green-800 outline-none focus:border-green-500" 
                        placeholder="0.00" value={form.valor_recebido} onChange={handleChange} />
                </div>
            </div>
        </div>

        {/* === COLUNA DIREITA: GERADOR === */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg"><Building size={20} /></div>
                <h4 className="font-bold text-gray-800">Dados do Prestador (Usina)</h4>
            </div>

            {/* ABAS */}
            <div className="flex gap-2 mb-2 p-1 bg-gray-100 rounded-lg">
                <button type="button" onClick={() => setModoUsina('buscar')} 
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${modoUsina === 'buscar' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>
                    🔍 Buscar Cadastrado
                </button>
                <button type="button" onClick={() => setModoUsina('novo')} 
                    className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${modoUsina === 'novo' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}>
                    ➕ Novo Cadastro
                </button>
            </div>

            {modoUsina === 'buscar' ? (
                <div className="relative">
                    <select className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:border-blue-500"
                        onChange={(e) => selecionarUsina(e.target.value)} defaultValue="">
                        <option value="" disabled>Selecione uma Usina...</option>
                        {listaUsinas.map((u: any) => (
                             <option key={u.id || u.usina_id} value={u.id || u.usina_id}>
                                {u.nome || u.nome || 'Sem Nome'}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs text-red-800 mb-2">
                    Cadastre o proprietário da usina.
                </div>
            )}

            <div className="space-y-3">
                <input type="text" name="gerador_nome" placeholder="Nome do Proprietário" required className="w-full p-3 border rounded-xl text-sm" value={form.gerador_nome} onChange={handleChange} />
                <input type="text" name="gerador_doc" placeholder="CPF / CNPJ" className="w-full p-3 border rounded-xl text-sm" value={form.gerador_doc} onChange={handleChange} />
                
                {modoUsina === 'novo' && (
                    <button type="button" onClick={salvarNovaUsina} className="w-full py-2 bg-red-600 text-white rounded-lg font-bold text-xs hover:bg-red-700 flex items-center justify-center gap-2">
                        <Save size={14}/> Salvar no Banco
                    </button>
                )}
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
                <label className="block text-xs font-bold text-red-700 uppercase mb-1">Valor Pago (Custo)</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-red-600 font-bold">R$</span>
                    <input type="number" name="valor_pago" required className="w-full pl-10 p-3 border border-red-200 bg-red-50/50 rounded-xl font-bold text-red-800 outline-none focus:border-red-500" 
                        placeholder="0.00" value={form.valor_pago} onChange={handleChange} />
                </div>
            </div>
        </div>

        {/* RODAPÉ */}
        <div className="lg:col-span-2 bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-full"><Calculator size={32} className="text-white" /></div>
                <div>
                    <p className="text-slate-400 text-sm uppercase font-bold">Spread (Lucro Bruto)</p>
                    <h2 className={`text-3xl font-black ${resultado.spread < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        R$ {resultado.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-blue-300 mt-1">Margem: {resultado.margem.toFixed(1)}%</p>
                </div>
            </div>
            <button type="submit" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center gap-3 transition-transform hover:scale-105">
                <FileDown size={24} /> <span>Baixar Minuta PDF</span>
            </button>
        </div>

      </form>
    </div>
  );
}
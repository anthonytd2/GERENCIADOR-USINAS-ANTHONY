import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';
import { FileText, User, Building, Search, FileDown, RefreshCw, Calculator, Save, Plus } from 'lucide-react';
import { gerarMinutaPDF } from '../../utils/gerarMinutaPDF';

export default function EmitirMinuta() {
  const [loading, setLoading] = useState(false);
  
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

      setListaConsumidores(consumidores || []);
      setListaUsinas(usinas || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar listas.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE SELEÇÃO CORRIGIDA ---
  const selecionarConsumidor = (idSelecionado: string) => {
    const selecionado = listaConsumidores.find(c => 
        String(c.id) === idSelecionado || String(c.consumidor_id) === idSelecionado
    );

    if (selecionado) {
      setForm(prev => ({
        ...prev,
        consumidor_nome: selecionado.nome || selecionado.razao_social || '',
        // CORREÇÃO: Agora ele busca a palavra 'documento' primeiro
        consumidor_doc: selecionado.documento || selecionado.cpf_cnpj || selecionado.cpf || selecionado.cnpj || '',
        consumidor_endereco: selecionado.endereco || selecionado.logradouro || '',
        consumidor_inscricao: selecionado.inscricao_estadual || selecionado.ie || 'Isento'
      }));
      toast.success("Dados do consumidor preenchidos!");
    }
  };

  const selecionarUsina = (idSelecionado: string) => {
    const selecionada = listaUsinas.find(u => 
        String(u.id) === idSelecionado || String(u.usina_id) === idSelecionado || String(u.usinaId) === idSelecionado
    );

    if (selecionada) {
      setForm(prev => ({
        ...prev,
        gerador_nome: selecionada.nome || selecionada.proprietario || selecionada.nome_proprietario || '',
        // CORREÇÃO: Adicionado o 'documento' aqui também, por segurança
        gerador_doc: selecionada.documento || selecionada.cpf_cnpj || ''
      }));
      toast.success("Dados da usina preenchidos!");
    }
  };

  // --- SALVAR NOVO ---
  const salvarNovoConsumidor = async () => {
    if(!form.consumidor_nome) return toast.error("Preencha o nome do Consumidor");
    try {
        const toastId = toast.loading("Salvando Consumidor...");
        await api.consumidores.create({
            nome: form.consumidor_nome.toUpperCase(),
            documento: form.consumidor_doc, // Usando 'documento' para casar com o banco
            endereco: form.consumidor_endereco.toUpperCase(),
            inscricao_estadual: form.consumidor_inscricao
        });
        await carregarDados();
        setModoConsumidor('buscar');
        toast.success("Consumidor Salvo!", { id: toastId });
    } catch (error) {
        toast.error("Erro ao salvar consumidor.");
    }
  };

  const salvarNovaUsina = async () => {
    if(!form.gerador_nome) return toast.error("Preencha o nome da Usina");
    try {
        const toastId = toast.loading("Salvando Usina...");
        await api.usinas.create({
            nome: form.gerador_nome.toUpperCase(),
            cpf_cnpj: form.gerador_doc, // Pode precisar ajustar para 'documento' se a API exigir
            nome_proprietario: form.gerador_nome.toUpperCase(),
            tipo: 'SOLAR',
            potencia: 0
        });
        await carregarDados();
        setModoUsina('buscar');
        toast.success("Usina Salva!", { id: toastId });
    } catch (error) {
        toast.error("Erro ao salvar usina.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Transforma em maiúsculo automaticamente os campos de texto, exceto valores
    const name = e.target.name;
    const value = (name === 'valor_recebido' || name === 'valor_pago' || name === 'data_emissao') 
      ? e.target.value 
      : e.target.value.toUpperCase();

    setForm({ ...form, [name]: value });
  };

  const handleGerarPDF = (e: React.FormEvent) => {
    e.preventDefault();
    gerarMinutaPDF(form, resultado);
  };

  // Estilo padrão dos inputs (Premium)
  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 outline-none";

  return (
    <div className="space-y-6 animate-fade-in-down pb-20 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="bg-slate-900 p-8 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Efeito visual de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="relative z-10">
          <h3 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl">
               <FileText className="w-8 h-8 text-blue-400" /> 
            </div>
            Relatório Financeiro
          </h3>
          <p className="text-slate-400 mt-2 font-medium">Preencha as informações para gerar a minuta de pagamento e recebimento.</p>
        </div>
        <button 
          onClick={carregarDados} 
          className="relative z-10 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all font-bold text-sm flex items-center gap-2 text-slate-200"
        >
            <RefreshCw size={18} className={loading ? "animate-spin text-blue-400" : "text-blue-400"} />
            Atualizar Cadastros
        </button>
      </div>

      <form onSubmit={handleGerarPDF} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* === COLUNA ESQUERDA: CONSUMIDOR === */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><User size={24} /></div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Tomador (Consumidor)</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Quem paga o boleto</p>
                </div>
            </div>

            {/* ABAS CONSUMIDOR */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl shadow-inner mb-6">
                <button type="button" onClick={() => setModoConsumidor('buscar')} 
                    className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${modoConsumidor === 'buscar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Search size={16}/> Buscar Existente
                </button>
                <button type="button" onClick={() => setModoConsumidor('novo')} 
                    className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${modoConsumidor === 'novo' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Plus size={16}/> Cadastrar Novo
                </button>
            </div>

            {modoConsumidor === 'buscar' ? (
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Selecione o Cliente</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                        onChange={(e) => selecionarConsumidor(e.target.value)} defaultValue="">
                        <option value="" disabled>Selecione um cliente da lista...</option>
                        {listaConsumidores.map((c: any) => (
                            <option key={c.id || c.consumidor_id} value={c.id || c.consumidor_id}>
                                {c.nome || c.razao_social || 'Sem Nome'}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm font-medium text-blue-800 mb-6 flex items-start gap-2">
                    Digite os dados abaixo. Eles serão salvos no sistema para uso futuro.
                </div>
            )}

            {/* CAMPOS CONSUMIDOR */}
            <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome / Razão Social</label>
                  <input type="text" name="consumidor_nome" placeholder="EX: JOÃO DA SILVA" required className={inputClass} value={form.consumidor_nome} onChange={handleChange} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">CPF / CNPJ</label>
                    <input type="text" name="consumidor_doc" placeholder="000.000.000-00" className={inputClass} value={form.consumidor_doc} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Insc. Estadual</label>
                    <input type="text" name="consumidor_inscricao" placeholder="ISENTO" className={inputClass} value={form.consumidor_inscricao} onChange={handleChange} />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Endereço Completo</label>
                  <input type="text" name="consumidor_endereco" placeholder="RUA, NÚMERO, BAIRRO, CIDADE" className={inputClass} value={form.consumidor_endereco} onChange={handleChange} />
                </div>
                
                {modoConsumidor === 'novo' && (
                    <button type="button" onClick={salvarNovoConsumidor} className="w-full py-3.5 mt-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 transition-all">
                        <Save size={18}/> Salvar Cliente no Banco de Dados
                    </button>
                )}
            </div>

            {/* CAIXA DE VALOR (CONSUMIDOR) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <label className="block text-xs font-bold text-emerald-600 uppercase mb-2 tracking-wide">Valor Recebido do Cliente</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-lg">R$</span>
                    <input type="number" step="0.01" name="valor_recebido" required 
                      className="w-full pl-12 pr-4 py-4 border-2 border-emerald-200 bg-emerald-50/30 rounded-xl font-black text-emerald-800 text-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-emerald-300" 
                      placeholder="0.00" value={form.valor_recebido} onChange={handleChange} 
                    />
                </div>
            </div>
        </div>

        {/* === COLUNA DIREITA: GERADOR === */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Building size={24} /></div>
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">Prestador (Usina)</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Quem recebe o repasse</p>
                </div>
            </div>

            {/* ABAS USINA */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl shadow-inner mb-6">
                <button type="button" onClick={() => setModoUsina('buscar')} 
                    className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${modoUsina === 'buscar' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Search size={16}/> Buscar Existente
                </button>
                <button type="button" onClick={() => setModoUsina('novo')} 
                    className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${modoUsina === 'novo' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Plus size={16}/> Cadastrar Novo
                </button>
            </div>

            {modoUsina === 'buscar' ? (
                <div className="mb-6">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Selecione a Usina</label>
                    <select className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none"
                        onChange={(e) => selecionarUsina(e.target.value)} defaultValue="">
                        <option value="" disabled>Selecione uma Usina da lista...</option>
                        {listaUsinas.map((u: any) => (
                             <option key={u.id || u.usina_id} value={u.id || u.usina_id}>
                                {u.nome || u.nome_proprietario || 'Sem Nome'}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm font-medium text-amber-800 mb-6 flex items-start gap-2">
                    Cadastre o proprietário da usina. Ele ficará salvo para o futuro.
                </div>
            )}

            {/* CAMPOS USINA */}
            <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome do Proprietário da Usina</label>
                  <input type="text" name="gerador_nome" placeholder="EX: FAZENDA SOL NASCENTE" required className={inputClass} value={form.gerador_nome} onChange={handleChange} />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">CPF / CNPJ</label>
                  <input type="text" name="gerador_doc" placeholder="000.000.000-00" className={inputClass} value={form.gerador_doc} onChange={handleChange} />
                </div>
                
                {modoUsina === 'novo' && (
                    <button type="button" onClick={salvarNovaUsina} className="w-full py-3.5 mt-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 transition-all">
                        <Save size={18}/> Salvar Usina no Banco de Dados
                    </button>
                )}
            </div>

            {/* CAIXA DE VALOR (USINA) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <label className="block text-xs font-bold text-amber-600 uppercase mb-2 tracking-wide">Valor Pago (Repasse/Custo)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-600 font-black text-lg">R$</span>
                    <input type="number" step="0.01" name="valor_pago" required 
                      className="w-full pl-12 pr-4 py-4 border-2 border-amber-200 bg-amber-50/30 rounded-xl font-black text-amber-800 text-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all placeholder:text-amber-300" 
                      placeholder="0.00" value={form.valor_pago} onChange={handleChange} 
                    />
                </div>
            </div>
        </div>

        {/* === RODAPÉ: RESULTADOS E BOTÃO FINAL === */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mt-2">
            <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="p-4 bg-slate-900 rounded-2xl shadow-md"><Calculator size={36} className="text-blue-400" /></div>
                <div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Spread (Lucro Bruto)</p>
                    <h2 className={`text-4xl font-black tracking-tight ${resultado.spread < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        R$ {resultado.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${resultado.margem < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        Margem: {resultado.margem.toFixed(1)}%
                      </span>
                      <span className="text-xs font-medium text-slate-400">sobre o recebido</span>
                    </div>
                </div>
            </div>
            
            <button type="submit" className="w-full md:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 transition-all">
                <FileDown size={24} /> <span>Gerar Minuta PDF</span>
            </button>
        </div>

      </form>
    </div>
  );
}
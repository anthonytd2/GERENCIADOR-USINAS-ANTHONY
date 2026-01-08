import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ArrowLeft, Plus, Save, Trash2, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

// --- COMPONENTE DO RECIBO (Fica escondido até imprimir) ---
const ReciboTemplate = React.forwardRef((props: any, ref: any) => {
  const { numero, valor, pagador, emitente, referente, cidade, data, formatarMoeda, formatarData } = props;

  return (
    <div ref={ref} className="p-10 font-serif text-black" style={{ width: '210mm', minHeight: '148mm' }}>
      <div className="border-4 border-double border-slate-800 p-8 h-full flex flex-col justify-between relative">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-4xl font-bold tracking-widest text-slate-900">RECIBO</h1>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-xl font-bold">Nº</span>
              <span className="text-2xl font-bold text-red-600 border-b-2 border-slate-400 min-w-[60px] text-center inline-block">
                {numero}
              </span>
            </div>
            <div className="bg-slate-100 border border-slate-300 px-4 py-2 rounded inline-block">
              <span className="text-sm font-bold text-slate-500 mr-2">VALOR</span>
              <span className="text-2xl font-bold text-slate-900">{formatarMoeda(valor)}</span>
            </div>
          </div>
        </div>

        {/* CORPO */}
        <div className="space-y-6 text-lg leading-relaxed">
          <div>
            <span className="font-bold mr-2">RECEBI(EMOS) DE:</span>
            <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2">
              {pagador.nome || '__________________________________________________'}
            </span>
          </div>
          <div>
            <span className="font-bold mr-2">CPF/CNPJ:</span>
            <span className="border-b border-dotted border-slate-400 font-medium px-2">
              {pagador.documento || '____________________'}
            </span>
          </div>
          <div>
            <span className="font-bold mr-2">ENDEREÇO:</span>
            <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2 w-full inline-block">
              {pagador.endereco || '__________________________________________________________________'}
            </span>
          </div>
          <div className="bg-slate-50 p-4 border border-slate-200 rounded italic mt-4 mb-4">
            <span className="font-bold not-italic mr-2">A IMPORTÂNCIA DE:</span>
            <span className="font-bold text-xl uppercase">({formatarMoeda(valor)})</span>
          </div>
          <div>
            <span className="font-bold mr-2">REFERENTE A:</span>
            <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2 w-full inline-block">
              {referente}
            </span>
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="mt-12 flex flex-col items-center">
          <p className="text-right w-full mb-12 text-lg">
            {cidade.toUpperCase()}, <span className="font-bold">{formatarData(data)}</span>.
          </p>
          <div className="text-center w-2/3">
            <div className="border-b border-slate-800 mb-2"></div>
            <p className="font-bold text-lg uppercase">{emitente.nome || 'NOME DO EMITENTE'}</p>
            <p className="text-sm text-slate-600">CNPJ/CPF: {emitente.documento || '00.000.000/0000-00'}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function GerenciadorRecibos() {
  const [activeTab, setActiveTab] = useState('emitir'); // 'emitir' ou 'empresas'

  // --- ESTADOS DE DADOS ---
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  // --- ESTADOS DO FORMULÁRIO DE RECIBO ---
  const [numero, setNumero] = useState('1');
  const [valor, setValor] = useState('');
  const [referente, setReferente] = useState('LOCAÇÃO DE USINA SOLAR');
  const [cidade, setCidade] = useState('NOVA AURORA');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Selecionados
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('');

  // Objetos completos para impressão
  const [pagadorAtual, setPagadorAtual] = useState({ nome: '', documento: '', endereco: '' });
  const [emitenteAtual, setEmitenteAtual] = useState({ nome: 'SOLAR LOCAÇÕES', documento: '' });

  // --- ESTADOS DO CADASTRO DE EMPRESA ---
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: '', documento: '', cidade: 'NOVA AURORA' });

  const componentRef = useRef(null);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const listaClientes = await api.consumidores.list();
      setClientes(listaClientes || []);

      const listaEmpresas = await api.entidades.list();
      setEmpresas(listaEmpresas || []);
      
      // Seleciona a primeira empresa automaticamente se existir
      if (listaEmpresas && listaEmpresas.length > 0) {
        setSelectedEmpresaId(listaEmpresas[0].id);
        setEmitenteAtual(listaEmpresas[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  }

  // --- HANDLERS ---
  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedClienteId(id);
    const cliente = clientes.find(c => c.id.toString() === id);
    if (cliente) {
      setPagadorAtual({
        nome: cliente.nome,
        documento: cliente.cpf_cnpj || '', // Ajuste conforme seu banco (cpf ou documento)
        endereco: cliente.endereco || ''
      });
    } else {
      setPagadorAtual({ nome: '', documento: '', endereco: '' });
    }
  };

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEmpresaId(id);
    const empresa = empresas.find(e => e.id.toString() === id);
    if (empresa) setEmitenteAtual(empresa);
  };

  const salvarNovaEmpresa = async () => {
    if (!novaEmpresa.nome) return alert("Preencha o nome da empresa");
    try {
      await api.entidades.create(novaEmpresa);
      alert("Empresa cadastrada com sucesso!");
      setNovaEmpresa({ nome: '', documento: '', cidade: 'NOVA AURORA' });
      carregarDados(); // Recarrega a lista
    } catch (e) {
      alert("Erro ao salvar empresa");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Recibo_${numero}`,
  });

  // --- FORMATADORES ---
  const formatarMoeda = (val: string) => {
    if (!val) return 'R$ 0,00';
    const num = parseFloat(val);
    return isNaN(num) ? 'R$ 0,00' : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };
  
  const formatarData = (d: string) => {
    if (!d) return '';
    const [ano, mes, dia] = d.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      
      {/* AREA OCULTA DE IMPRESSÃO (Só aparece no papel) */}
      <div style={{ display: 'none' }}>
        <ReciboTemplate 
          ref={componentRef}
          numero={numero}
          valor={valor}
          pagador={pagadorAtual}
          emitente={emitenteAtual}
          referente={referente}
          cidade={cidade}
          data={data}
          formatarMoeda={formatarMoeda}
          formatarData={formatarData}
        />
      </div>

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Gerador de Recibos
          </h1>
        </div>
        
        {/* BOTÕES DE ABAS */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm border">
          <button 
            onClick={() => setActiveTab('emitir')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'emitir' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Emitir Recibo
          </button>
          <button 
            onClick={() => setActiveTab('empresas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'empresas' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Cadastrar Empresas (Emitentes)
          </button>
        </div>
      </div>

      {/* --- CONTEÚDO DA TELA --- */}
      
      {/* ABA 1: EMITIR RECIBO */}
      {activeTab === 'emitir' && (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* QUEM RECEBE (EMPRESA) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="flex items-center gap-2 text-sm font-bold text-blue-800 mb-2">
                <Building2 className="w-4 h-4" /> QUEM ESTÁ RECEBENDO (Emitente)
              </label>
              <select 
                value={selectedEmpresaId} 
                onChange={handleEmpresaChange}
                className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a Empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-2">
                {emitenteAtual.nome} <br/> {emitenteAtual.documento}
              </p>
            </div>

            {/* QUEM PAGA (CLIENTE) */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <label className="flex items-center gap-2 text-sm font-bold text-green-800 mb-2">
                <User className="w-4 h-4" /> QUEM VAI PAGAR (Cliente)
              </label>
              <div className="flex gap-2">
                <select 
                  value={selectedClienteId} 
                  onChange={handleClienteChange}
                  className="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione o Cliente...</option>
                  {clientes.map(cli => (
                    <option key={cli.id} value={cli.id}>{cli.nome}</option>
                  ))}
                </select>
                <Link to="/consumidores/novo" className="p-2 bg-green-200 rounded hover:bg-green-300 text-green-800" title="Novo Cliente">
                  <Plus className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-xs text-green-700 mt-2">
                {pagadorAtual.nome ? pagadorAtual.nome : 'Nenhum cliente selecionado'}
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Detalhes do Recibo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                value={valor} 
                onChange={e => setValor(e.target.value)} 
                className="w-full p-3 border rounded-lg text-lg font-semibold text-slate-800"
                placeholder="0,00"
              />
              <p className="text-sm text-slate-500 mt-1">{formatarMoeda(valor)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Número do Recibo</label>
              <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 border rounded-lg" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Referente a</label>
              <input type="text" value={referente} onChange={e => setReferente(e.target.value)} className="w-full p-3 border rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Cidade</label>
              <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-3 border rounded-lg" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full p-3 border rounded-lg" />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-105"
            >
              <Printer className="w-6 h-6" />
              IMPRIMIR RECIBO
            </button>
          </div>
        </div>
      )}

      {/* ABA 2: CADASTRO DE EMPRESAS */}
      {activeTab === 'empresas' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Nova Empresa / Entidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nome da Empresa</label>
                <input type="text" value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} className="w-full p-2 border rounded" placeholder="Ex: Solar Locações Ltda" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">CNPJ / CPF</label>
                <input type="text" value={novaEmpresa.documento} onChange={e => setNovaEmpresa({...novaEmpresa, documento: e.target.value})} className="w-full p-2 border rounded" placeholder="00.000.000/0000-00" />
              </div>
              <button onClick={salvarNovaEmpresa} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium flex justify-center items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Empresa
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Documento</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{emp.nome}</td>
                    <td className="p-4">{emp.documento}</td>
                    <td className="p-4 text-right">
                      <button 
                         onClick={async () => {
                           if(confirm('Excluir empresa?')) {
                             await api.entidades.delete(emp.id);
                             carregarDados();
                           }
                         }}
                         className="text-red-500 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {empresas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">Nenhuma empresa cadastrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
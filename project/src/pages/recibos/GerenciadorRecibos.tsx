import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ArrowLeft, Plus, Save, Trash2, Building2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

// --- COMPONENTE DO RECIBO (VISUAL PADRONIZADO) ---
const ReciboTemplate = React.forwardRef((props: any, ref: any) => {
  const { numero, valor, pagador, emitente, referente, cidade, data, formatarMoeda, formatarData } = props;

  return (
    <div ref={ref} className="p-10 font-serif text-black bg-white" style={{ width: '210mm', minHeight: '148mm' }}>
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
            {/* Mostra endereço do emitente se houver, opcional */}
             {emitente.endereco && <p className="text-xs text-slate-500 mt-1">{emitente.endereco}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

export default function GerenciadorRecibos() {
  const [activeTab, setActiveTab] = useState('emitir'); 

  // --- DADOS DO BANCO ---
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  // --- CAMPOS DO RECIBO (EDITÁVEIS) ---
  const [numero, setNumero] = useState('1');
  const [valor, setValor] = useState('');
  const [referente, setReferente] = useState('LOCAÇÃO DE USINA SOLAR');
  const [cidade, setCidade] = useState('NOVA AURORA');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Quem Paga (Dados Editáveis)
  const [pagadorNome, setPagadorNome] = useState('');
  const [pagadorDoc, setPagadorDoc] = useState('');
  const [pagadorEnd, setPagadorEnd] = useState('');

  // Quem Recebe/Assina (Dados Editáveis)
  const [emitenteNome, setEmitenteNome] = useState('');
  const [emitenteDoc, setEmitenteDoc] = useState('');
  const [emitenteEnd, setEmitenteEnd] = useState(''); // Endereço extra se precisar

  // --- CADASTRO DE NOVA EMPRESA ---
  const [novaEmpresa, setNovaEmpresa] = useState({ 
    nome: '', documento: '', endereco: '', cidade: 'NOVA AURORA', uf: 'PR' 
  });

  const componentRef = useRef(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const listaClientes = await api.consumidores.list();
      setClientes(listaClientes || []);
      const listaEmpresas = await api.entidades.list();
      setEmpresas(listaEmpresas || []);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  }

  // Ao selecionar um cliente, preenche os campos mas deixa editar
  const selecionarCliente = (id: string) => {
    const cli = clientes.find(c => c.id.toString() === id);
    if (cli) {
      setPagadorNome(cli.nome);
      setPagadorDoc(cli.cpf_cnpj || '');
      setPagadorEnd(cli.endereco || '');
    }
  };

  // Ao selecionar uma empresa, preenche os campos mas deixa editar
  const selecionarEmpresa = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setEmitenteNome(emp.nome);
      setEmitenteDoc(emp.documento || '');
      setEmitenteEnd(emp.endereco || '');
      if(emp.cidade) setCidade(emp.cidade);
    }
  };

  const salvarNovaEmpresa = async () => {
    if (!novaEmpresa.nome) return alert("Preencha o nome da empresa");
    try {
      await api.entidades.create(novaEmpresa);
      alert("Empresa cadastrada com sucesso!");
      setNovaEmpresa({ nome: '', documento: '', endereco: '', cidade: 'NOVA AURORA', uf: 'PR' });
      carregarDados();
    } catch (e) {
      alert("Erro ao salvar empresa. Verifique se o backend está rodando.");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Recibo_${numero}`,
  });

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
      
      {/* AREA OCULTA DE IMPRESSÃO */}
      <div style={{ display: 'none' }}>
        <ReciboTemplate 
          ref={componentRef}
          numero={numero}
          valor={valor}
          pagador={{ nome: pagadorNome, documento: pagadorDoc, endereco: pagadorEnd }}
          emitente={{ nome: emitenteNome, documento: emitenteDoc, endereco: emitenteEnd }}
          referente={referente}
          cidade={cidade}
          data={data}
          formatarMoeda={formatarMoeda}
          formatarData={formatarData}
        />
      </div>

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
            Cadastrar Emitentes
          </button>
        </div>
      </div>

      {/* ABA EMITIR */}
      {activeTab === 'emitir' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* COLUNA 1: DADOS DO PAGAMENTO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> 1. Quem Paga (Cliente)
            </h2>
            
            <div className="mb-4 bg-green-50 p-3 rounded border border-green-100">
              <label className="text-xs font-bold text-green-800 uppercase mb-1 block">Buscar do Banco de Dados</label>
              <select 
                onChange={(e) => selecionarCliente(e.target.value)}
                className="w-full p-2 border rounded bg-white"
              >
                <option value="">Selecione para preencher auto...</option>
                {clientes.map(cli => (
                  <option key={cli.id} value={cli.id}>{cli.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500">Nome do Pagador</label>
                <input value={pagadorNome} onChange={e => setPagadorNome(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">CPF / CNPJ</label>
                <input value={pagadorDoc} onChange={e => setPagadorDoc(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500">Endereço Completo</label>
                <textarea rows={2} value={pagadorEnd} onChange={e => setPagadorEnd(e.target.value)} className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>

          {/* COLUNA 2: DADOS DO EMITENTE E VALORES */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> 2. Quem Recebe (Emitente)
              </h2>

              <div className="mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                <label className="text-xs font-bold text-blue-800 uppercase mb-1 block">Buscar Emitente Salvo</label>
                <select 
                  onChange={(e) => selecionarEmpresa(e.target.value)}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">Selecione...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Nome na Assinatura</label>
                  <input value={emitenteNome} onChange={e => setEmitenteNome(e.target.value)} className="w-full p-2 border rounded bg-yellow-50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Documento</label>
                    <input value={emitenteDoc} onChange={e => setEmitenteDoc(e.target.value)} className="w-full p-2 border rounded bg-yellow-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Cidade da Data</label>
                    <input value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-slate-700 mb-4">3. Valores</h2>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-medium text-slate-500">Valor R$</label>
                  <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full p-2 border rounded text-lg font-bold text-slate-800" placeholder="0.00"/>
                 </div>
                 <div>
                  <label className="block text-xs font-medium text-slate-500">Nº Recibo</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-2 border rounded" />
                 </div>
              </div>
              <div className="mt-3">
                 <label className="block text-xs font-medium text-slate-500">Referente a</label>
                 <input type="text" value={referente} onChange={e => setReferente(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              
              <button
                onClick={handlePrint}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-lg shadow-lg"
              >
                <Printer className="w-5 h-5" /> IMPRIMIR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA CADASTRO DE EMPRESAS - AGORA COMPLETA */}
      {activeTab === 'empresas' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Cadastrar Novo Emitente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nome da Empresa / Pessoa</label>
                <input type="text" value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">CNPJ / CPF</label>
                <input type="text" value={novaEmpresa.documento} onChange={e => setNovaEmpresa({...novaEmpresa, documento: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Endereço Completo</label>
                <input type="text" value={novaEmpresa.endereco} onChange={e => setNovaEmpresa({...novaEmpresa, endereco: e.target.value})} className="w-full p-2 border rounded" placeholder="Rua, Número, Bairro" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Cidade</label>
                <input type="text" value={novaEmpresa.cidade} onChange={e => setNovaEmpresa({...novaEmpresa, cidade: e.target.value})} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">UF</label>
                <input type="text" value={novaEmpresa.uf} onChange={e => setNovaEmpresa({...novaEmpresa, uf: e.target.value})} className="w-full p-2 border rounded" maxLength={2} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={salvarNovaEmpresa} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                <Save className="w-4 h-4" /> Salvar Emitente
              </button>
            </div>
          </div>

          {/* LISTA DE EMPRESAS SALVAS */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Documento</th>
                  <th className="p-4">Cidade/UF</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">{emp.nome}</td>
                    <td className="p-4">{emp.documento}</td>
                    <td className="p-4">{emp.cidade}/{emp.uf}</td>
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
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum emitente cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
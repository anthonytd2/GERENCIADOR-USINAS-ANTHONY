import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ArrowLeft, Plus, Save, Trash2, Building2, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

// --- TEMPLATE DO RECIBO (VISUAL IGUAL PDF) ---
const ReciboTemplate = React.forwardRef((props: any, ref: any) => {
  const { numero, valor, pagador, emitente, referente, data, formatarMoeda, formatarData } = props;

  // Usa a cidade/UF do emitente para a data, ou vazio se não tiver
  const cidadeData = emitente.cidade ? emitente.cidade.toUpperCase() : 'NOVA AURORA';
  const ufData = emitente.uf ? emitente.uf.toUpperCase() : 'PR';

  return (
    <div ref={ref} className="p-10 font-serif text-black bg-white" style={{ width: '210mm', minHeight: '148mm' }}>
      <div className="border-4 border-double border-slate-800 p-8 h-full flex flex-col justify-between relative">
        
        {/* CABEÇALHO DO RECIBO (DADOS DO EMITENTE + TITULO) */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            
            {/* LADO ESQUERDO: DADOS DA EMPRESA (EMITENTE) */}
            <div className="w-2/3 pr-4">
              <h2 className="text-2xl font-bold text-slate-900 uppercase">{emitente.nome || 'NOME DA SUA EMPRESA'}</h2>
              <div className="text-sm text-slate-700 uppercase mt-1 leading-snug">
                <p>CNPJ/CPF: {emitente.documento || '00.000.000/0000-00'}</p>
                <p>{emitente.endereco || 'ENDEREÇO DA EMPRESA'}</p>
                <p>{emitente.cidade} - {emitente.uf}</p>
              </div>
            </div>

            {/* LADO DIREITO: NÚMERO E VALOR */}
            <div className="text-right w-1/3">
              <div className="mb-2">
                <h1 className="text-3xl font-bold tracking-widest text-slate-900">RECIBO</h1>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-lg font-bold">Nº</span>
                  <span className="text-xl font-bold text-red-600 border-b-2 border-slate-400 min-w-[60px] text-center inline-block">
                    {numero}
                  </span>
                </div>
              </div>
              <div className="bg-slate-100 border border-slate-300 px-3 py-2 rounded inline-block mt-2 shadow-sm">
                <span className="text-xs font-bold text-slate-500 mr-2 block text-left">VALOR</span>
                <span className="text-2xl font-bold text-slate-900">{formatarMoeda(valor)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CORPO DO RECIBO */}
        <div className="space-y-6 text-lg leading-relaxed uppercase">
          
          {/* QUEM PAGA */}
          <div>
            <span className="font-bold mr-2">RECEBI(EMOS) DE:</span>
            <span className="border-b border-dotted border-slate-400 font-medium px-2 block sm:inline-block w-full sm:w-auto">
              {pagador.nome || '__________________________________________________'}
            </span>
          </div>
          
          <div className="flex gap-4 flex-wrap">
             <div className="flex-1">
                <span className="font-bold mr-2">CPF/CNPJ:</span>
                <span className="border-b border-dotted border-slate-400 font-medium px-2 inline-block min-w-[200px]">
                  {pagador.documento || '____________________'}
                </span>
             </div>
          </div>

          <div>
            <span className="font-bold mr-2">ENDEREÇO:</span>
            <span className="border-b border-dotted border-slate-400 font-medium px-2 w-full inline-block">
              {pagador.endereco || '__________________________________________________________________'}
            </span>
          </div>

          {/* VALOR E REFERENTE */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded italic mt-4 mb-4 shadow-sm">
            <span className="font-bold not-italic mr-2">A IMPORTÂNCIA DE:</span>
            <span className="font-bold text-xl">({formatarMoeda(valor)})</span>
          </div>
          
          <div>
            <span className="font-bold mr-2">REFERENTE A:</span>
            <span className="border-b border-dotted border-slate-400 font-medium px-2 w-full inline-block">
              {referente}
            </span>
          </div>
        </div>

        {/* RODAPÉ (DATA E ASSINATURA) */}
        <div className="mt-12 flex flex-col items-center">
          <p className="text-right w-full mb-12 text-lg uppercase">
            {cidadeData}, <span className="font-bold">{formatarData(data)}</span>.
          </p>
          <div className="text-center w-2/3">
            <div className="border-b border-slate-800 mb-2"></div>
            {/* ASSINATURA */}
            <p className="font-bold text-lg uppercase">{emitente.nome || 'ASSINATURA DO EMITENTE'}</p>
            <p className="text-sm text-slate-600 uppercase">CNPJ/CPF: {emitente.documento}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function GerenciadorRecibos() {
  const [activeTab, setActiveTab] = useState('emitir'); 

  // --- DADOS DO BANCO ---
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  // --- CAMPOS DO RECIBO ---
  const [numero, setNumero] = useState('1');
  const [valor, setValor] = useState('');
  const [referente, setReferente] = useState('LOCAÇÃO DE USINA SOLAR'); 
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // PAGADOR (Quem Paga)
  const [pagadorNome, setPagadorNome] = useState('');
  const [pagadorDoc, setPagadorDoc] = useState('');
  const [pagadorEnd, setPagadorEnd] = useState('');

  // EMITENTE (Quem Recebe)
  const [emitenteNome, setEmitenteNome] = useState('');
  const [emitenteDoc, setEmitenteDoc] = useState('');
  const [emitenteEnd, setEmitenteEnd] = useState('');
  const [emitenteCidade, setEmitenteCidade] = useState(''); // Sem padrão fixo na edição
  const [emitenteUf, setEmitenteUf] = useState('');

  // --- CADASTRO DE NOVA EMPRESA (Sem Padrão Fixo) ---
  const [novaEmpresa, setNovaEmpresa] = useState({ 
    nome: '', documento: '', endereco: '', cidade: '', uf: '' 
  });

  const componentRef = useRef(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const listaEmpresas = await api.entidades.list();
      setEmpresas(listaEmpresas || []);
    } catch (error) {
      console.error("Erro ao carregar dados.", error);
    }
  }

  // --- FUNÇÕES DE SELEÇÃO ---
  
  const selecionarPagador = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setPagadorNome(emp.nome.toUpperCase());
      setPagadorDoc(emp.documento || '');
      setPagadorEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
    } else {
      setPagadorNome(''); setPagadorDoc(''); setPagadorEnd('');
    }
  };

  const selecionarEmitente = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setEmitenteNome(emp.nome.toUpperCase());
      setEmitenteDoc(emp.documento || '');
      setEmitenteEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
      if(emp.cidade) setEmitenteCidade(emp.cidade.toUpperCase());
      if(emp.uf) setEmitenteUf(emp.uf.toUpperCase());
    }
  };

  const salvarNovaEmpresa = async () => {
    if (!novaEmpresa.nome) return alert("Preencha o nome.");
    try {
      // Força salvar em Maiúsculo
      const empresaParaSalvar = {
        ...novaEmpresa,
        nome: novaEmpresa.nome.toUpperCase(),
        endereco: novaEmpresa.endereco.toUpperCase(),
        cidade: novaEmpresa.cidade.toUpperCase(),
        uf: novaEmpresa.uf.toUpperCase()
      };
      
      await api.entidades.create(empresaParaSalvar);
      alert("Empresa salva!");
      setNovaEmpresa({ nome: '', documento: '', endereco: '', cidade: '', uf: '' });
      carregarDados();
    } catch (e) {
      alert("Erro ao salvar. Verifique se o servidor backend está rodando e a tabela foi criada.");
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

  // Funções para input em Uppercase
  const handleInputUppercase = (setter: any) => (e: any) => {
    setter(e.target.value.toUpperCase());
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      
      {/* IMPRESSÃO INVISÍVEL */}
      <div style={{ display: 'none' }}>
        <ReciboTemplate 
          ref={componentRef}
          numero={numero}
          valor={valor}
          pagador={{ nome: pagadorNome, documento: pagadorDoc, endereco: pagadorEnd }}
          emitente={{ nome: emitenteNome, documento: emitenteDoc, endereco: emitenteEnd, cidade: emitenteCidade, uf: emitenteUf }}
          referente={referente}
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
        
        {/* ABAS */}
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
            Cadastrar Empresas
          </button>
        </div>
      </div>

      {/* --- ABA 1: EMISSÃO --- */}
      {activeTab === 'emitir' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: SELEÇÃO E DADOS */}
          <div className="space-y-6">
            
            {/* BOX 1: QUEM VAI PAGAR */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                1. Quem Paga (Pagador)
              </h2>
              <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar da Lista de Empresas</label>
                <select onChange={(e) => selecionarPagador(e.target.value)} className="w-full p-2 border rounded bg-white uppercase text-sm">
                  <option value="">Selecione quem está pagando...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <input value={pagadorNome} onChange={handleInputUppercase(setPagadorNome)} placeholder="NOME DO PAGADOR" className="w-full p-2 border rounded uppercase" />
                <input value={pagadorDoc} onChange={e => setPagadorDoc(e.target.value)} placeholder="CPF / CNPJ" className="w-full p-2 border rounded uppercase" />
                <textarea rows={2} value={pagadorEnd} onChange={handleInputUppercase(setPagadorEnd)} placeholder="ENDEREÇO COMPLETO" className="w-full p-2 border rounded uppercase" />
              </div>
            </div>

            {/* BOX 2: QUEM RECEBE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                2. Quem Recebe (Emitente)
              </h2>
              <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar da Lista de Empresas</label>
                <select onChange={(e) => selecionarEmitente(e.target.value)} className="w-full p-2 border rounded bg-white uppercase text-sm">
                  <option value="">Selecione quem está emitindo...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <input value={emitenteNome} onChange={handleInputUppercase(setEmitenteNome)} placeholder="NOME DO EMITENTE" className="w-full p-2 border rounded bg-blue-50 uppercase" />
                <div className="grid grid-cols-2 gap-2">
                   <input value={emitenteDoc} onChange={e => setEmitenteDoc(e.target.value)} placeholder="CNPJ/CPF" className="w-full p-2 border rounded bg-blue-50 uppercase" />
                   <input value={emitenteCidade} onChange={handleInputUppercase(setEmitenteCidade)} placeholder="CIDADE" className="w-full p-2 border rounded uppercase" />
                </div>
              </div>
            </div>

          </div>

          {/* LADO DIREITO: VALORES E IMPRESSÃO */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">3. Detalhes do Recibo</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full p-3 border rounded text-lg font-bold" placeholder="0.00" />
                  <p className="text-sm text-green-600 mt-1 font-medium">{formatarMoeda(valor)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nº Recibo</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 border rounded" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Referente a</label>
                <input type="text" value={referente} onChange={handleInputUppercase(setReferente)} className="w-full p-3 border rounded uppercase" />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-600 mb-1">Data de Emissão</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full p-3 border rounded" />
              </div>

              <div className="mt-auto">
                <button onClick={handlePrint} className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition-transform hover:scale-[1.02]">
                  <Printer className="w-6 h-6" /> IMPRIMIR RECIBO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ABA 2: CADASTRO --- */}
      {activeTab === 'empresas' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Cadastrar Empresa / Entidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nome</label>
                <input value={novaEmpresa.nome} onChange={handleInputUppercase((val:string) => setNovaEmpresa({...novaEmpresa, nome: val}))} className="w-full p-2 border rounded uppercase" placeholder="EX: SOLAR LOCAÇÕES" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">CNPJ / CPF</label>
                <input value={novaEmpresa.documento} onChange={e => setNovaEmpresa({...novaEmpresa, documento: e.target.value})} className="w-full p-2 border rounded uppercase" placeholder="00.000.000/0000-00" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Endereço Completo</label>
                <input value={novaEmpresa.endereco} onChange={handleInputUppercase((val:string) => setNovaEmpresa({...novaEmpresa, endereco: val}))} className="w-full p-2 border rounded uppercase" placeholder="RUA, NÚMERO, BAIRRO" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Cidade</label>
                <input value={novaEmpresa.cidade} onChange={handleInputUppercase((val:string) => setNovaEmpresa({...novaEmpresa, cidade: val}))} className="w-full p-2 border rounded uppercase" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">UF</label>
                <input value={novaEmpresa.uf} onChange={handleInputUppercase((val:string) => setNovaEmpresa({...novaEmpresa, uf: val}))} className="w-full p-2 border rounded uppercase" maxLength={2} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={salvarNovaEmpresa} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                <Save className="w-4 h-4" /> SALVAR EMPRESA
              </button>
            </div>
          </div>

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
                  <tr key={emp.id} className="border-b hover:bg-slate-50 uppercase">
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
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
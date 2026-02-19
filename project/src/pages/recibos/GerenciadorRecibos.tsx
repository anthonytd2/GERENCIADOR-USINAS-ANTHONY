import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  Printer, FileText, ArrowLeft, Save, Trash2, 
  Building2, UserCheck, Banknote, Calendar, MapPin, Search 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

// --- FUNÇÃO DE CONVERTER NÚMERO PARA EXTENSO ---
function valorPorExtenso(v: number): string {
  if (v === 0) return 'ZERO REAIS';

  const unidades = ['', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE'];
  const dezenas = ['', '', 'VINTE', 'TRINTA', 'QUARENTA', 'CINQUENTA', 'SESSENTA', 'SETENTA', 'OITENTA', 'NOVENTA'];
  const dezenasEspeciais = ['DEZ', 'ONZE', 'DOZE', 'TREZE', 'QUATORZE', 'QUINZE', 'DEZESSEIS', 'DEZESSETE', 'DEZOITO', 'DEZENOVE'];
  const centenas = ['', 'CENTO', 'DUZENTOS', 'TREZENTOS', 'QUATROCENTOS', 'QUINHENTOS', 'SEISCENTOS', 'SETECENTOS', 'OITOCENTOS', 'NOVECENTOS'];

  const convertGroup = (n: number): string => {
    if (n === 100) return 'CEM';
    let str = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) str += centenas[c];

    if (d === 1) {
      if (str) str += ' E ';
      str += dezenasEspeciais[u];
    } else {
      if (d > 0) {
        if (str) str += ' E ';
        str += dezenas[d];
      }
      if (u > 0) {
        if (str) str += ' E ';
        str += unidades[u];
      }
    }
    return str;
  };

  const inteiro = Math.floor(v);
  const centavos = Math.round((v - inteiro) * 100);
  let extenso = '';

  if (inteiro > 0) {
    const milhoes = Math.floor(inteiro / 1000000);
    const milhares = Math.floor((inteiro % 1000000) / 1000);
    const resto = inteiro % 1000;

    if (milhoes > 0) {
      extenso += convertGroup(milhoes) + (milhoes === 1 ? ' MILHÃO' : ' MILHÕES');
      if (milhares > 0 || resto > 0) extenso += ' E ';
    }

    if (milhares > 0) {
      extenso += convertGroup(milhares) + ' MIL';
      if (resto > 0) extenso += (resto < 100 || resto % 100 === 0) ? ' E ' : ', ';
    }

    if (resto > 0) {
      extenso += convertGroup(resto);
    }

    extenso += inteiro === 1 ? ' REAL' : ' REAIS';
  }

  if (centavos > 0) {
    if (extenso) extenso += ' E ';
    extenso += convertGroup(centavos) + (centavos === 1 ? ' CENTAVO' : ' CENTAVOS');
  }

  return extenso;
}

// --- TEMPLATE DO RECIBO ---
const ReciboTemplate = React.forwardRef((props: any, ref: any) => {
  const { numero, valor, pagador, emitente, referente, data, formatarMoeda, formatarData } = props;

  const cidadeData = emitente.cidade ? emitente.cidade.toUpperCase() : 'NOVA AURORA';
  const ufData = emitente.uf ? emitente.uf.toUpperCase() : 'PR';
  const valorExtenso = valor ? valorPorExtenso(parseFloat(valor)) : '';

  return (
    <div ref={ref} className="p-10 font-sans text-black bg-white" style={{ width: '210mm', minHeight: '148mm' }}>
      <div className="border-4 border-black p-6 h-full flex flex-col justify-between relative">
        <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-extrabold text-black tracking-wide">RECIBO</h1>
            <span className="text-4xl font-extrabold text-black ml-2">Nº {numero}</span>
          </div>
          <div className="bg-slate-100 border-2 border-black px-6 py-2 rounded shadow-sm">
            <span className="text-xs font-extrabold text-black block mb-1">VALOR</span>
            <span className="text-3xl font-extrabold text-black">{formatarMoeda(valor)}</span>
          </div>
        </div>
        <div className="space-y-6 text-xl leading-relaxed uppercase font-bold text-black">
          <div className="flex flex-col">
            <div className="flex items-baseline w-full">
              <span className="mr-2 whitespace-nowrap">RECEBI(EMOS) DE:</span>
              <span className="border-b-2 border-black px-2 flex-grow">{pagador.nome || ''}</span>
            </div>
          </div>
          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">CPF/CNPJ:</span>
            <span className="border-b-2 border-black px-2 flex-grow">{pagador.cpf_cnpj || ''}</span>
          </div>
          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">ENDEREÇO DO PAGADOR:</span>
            <span className="border-b-2 border-black px-2 flex-grow">
              {pagador.endereco || ''} {pagador.cidade ? `- ${pagador.cidade}${pagador.uf ? '/' + pagador.uf : ''}` : ''}
            </span>
          </div>
          <div className="bg-slate-50 p-4 border-2 border-black rounded my-4">
            <span className="text-sm block mb-1">A IMPORTÂNCIA DE:</span>
            <span className="text-lg leading-tight block">({valorExtenso || 'ZERO REAIS'})</span>
          </div>
          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">REFERENTE A:</span>
            <span className="border-b-2 border-black px-2 flex-grow">{referente}</span>
          </div>
          <div className="mt-6 pt-4 border-t-2 border-dotted border-black">
            <div className="flex items-baseline w-full">
              <span className="mr-2 whitespace-nowrap">EMITENTE:</span>
              <span className="px-2 flex-grow border-b-2 border-black">{emitente.nome} - CNPJ/CPF: {emitente.cpf_cnpj}</span>
            </div>
            <div className="flex items-baseline w-full mt-2">
              <span className="mr-2 whitespace-nowrap">ENDEREÇO EMITENTE:</span>
              <span className="px-2 flex-grow border-b-2 border-black">{emitente.endereco} {emitente.cidade ? `- ${emitente.cidade}/${emitente.uf}` : ''}</span>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center">
          <p className="text-right w-full mb-16 text-xl uppercase font-extrabold text-black">
            {cidadeData}/{ufData}, {formatarData(data)}.
          </p>
          <div className="text-center w-3/4">
            <div className="border-b-2 border-black mb-2"></div>
            <p className="font-extrabold text-xl uppercase text-black">{emitente.nome || 'ASSINATURA'}</p>
            <p className="text-md text-black uppercase font-bold">CNPJ/CPF: {emitente.cpf_cnpj}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// --- COMPONENTE PRINCIPAL ---
export default function GerenciadorRecibos() {
  const [activeTab, setActiveTab] = useState('emitir');
  const [empresas, setEmpresas] = useState<any[]>([]);

  // Dados do Recibo
  const [numero, setNumero] = useState('1');
  const [valor, setValor] = useState('');
  const [referente, setReferente] = useState('LOCAÇÃO DE USINA SOLAR');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  // Pagador e Emitente
  const [pagadorNome, setPagadorNome] = useState('');
  const [pagadorDoc, setPagadorDoc] = useState('');
  const [pagadorEnd, setPagadorEnd] = useState('');
  const [pagadorCidade, setPagadorCidade] = useState('');
  const [pagadorUf, setPagadorUf] = useState('');
  
  const [emitenteNome, setEmitenteNome] = useState('');
  const [emitenteDoc, setEmitenteDoc] = useState('');
  const [emitenteEnd, setEmitenteEnd] = useState('');
  const [emitenteCidade, setEmitenteCidade] = useState('');
  const [emitenteUf, setEmitenteUf] = useState('');

  // Cadastro
  const [novaEmpresa, setNovaEmpresa] = useState({
    nome: '', cpf_cnpj: '', endereco: '', cidade: '', uf: ''
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

  const selecionarPagador = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setPagadorNome(emp.nome.toUpperCase());
      setPagadorDoc(emp.cpf_cnpj || emp.documento || '');
      setPagadorEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
      setPagadorCidade(emp.cidade ? emp.cidade.toUpperCase() : '');
      setPagadorUf(emp.uf ? emp.uf.toUpperCase() : '');
    } else {
      setPagadorNome(''); setPagadorDoc(''); setPagadorEnd(''); setPagadorCidade(''); setPagadorUf('');
    }
  };

  const selecionarEmitente = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setEmitenteNome(emp.nome.toUpperCase());
      setEmitenteDoc(emp.cpf_cnpj || emp.documento || '');
      setEmitenteEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
      setEmitenteCidade(emp.cidade ? emp.cidade.toUpperCase() : '');
      setEmitenteUf(emp.uf ? emp.uf.toUpperCase() : '');
    } else {
      setEmitenteNome(''); setEmitenteDoc(''); setEmitenteEnd(''); setEmitenteCidade(''); setEmitenteUf('');
    }
  };

  const salvarNovaEmpresa = async () => {
    if (!novaEmpresa.nome) return alert("Preencha o nome.");
    try {
      const empresaParaSalvar = {
        ...novaEmpresa,
        nome: novaEmpresa.nome.toUpperCase(),
        endereco: novaEmpresa.endereco.toUpperCase(),
        cidade: novaEmpresa.cidade.toUpperCase(),
        uf: novaEmpresa.uf.toUpperCase()
      };
      await api.entidades.create(empresaParaSalvar);
      alert("Empresa salva!");
      setNovaEmpresa({ nome: '', cpf_cnpj: '', endereco: '', cidade: '', uf: '' });
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

  const handleInputUppercase = (setter: any) => (e: any) => {
    setter(e.target.value.toUpperCase());
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-700 placeholder:text-slate-400 uppercase outline-none";

  return (
    <div className="pb-20 animate-fade-in-down max-w-6xl mx-auto">

      {/* IMPRESSÃO INVISÍVEL */}
      <div style={{ display: 'none' }}>
        <ReciboTemplate
          ref={componentRef}
          numero={numero}
          valor={valor}
          pagador={{ nome: pagadorNome, cpf_cnpj: pagadorDoc, endereco: pagadorEnd, cidade: pagadorCidade, uf: pagadorUf }}
          emitente={{ nome: emitenteNome, cpf_cnpj: emitenteDoc, endereco: emitenteEnd, cidade: emitenteCidade, uf: emitenteUf }}
          referente={referente}
          data={data}
          formatarMoeda={formatarMoeda}
          formatarData={formatarData}
        />
      </div>

      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm">
                <FileText className="w-7 h-7" />
              </div>
              Gerador de Recibos
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Emita e imprima recibos de pagamento de forma fácil.</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-xl shadow-inner w-full md:w-auto">
          <button
            onClick={() => setActiveTab('emitir')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'emitir' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Emitir Recibo
          </button>
          <button
            onClick={() => setActiveTab('empresas')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'empresas' 
                ? 'bg-white text-blue-700 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            Cadastrar Empresas
          </button>
        </div>
      </div>

      {/* CONTEÚDO DAS TABS */}
      {activeTab === 'emitir' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUNA ESQUERDA */}
          <div className="space-y-8">
            
            {/* CARD: 1. PAGADOR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 rounded-l-2xl"></div>
              
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-500" />
                1. Quem Paga (Pagador)
              </h2>
              
              <div className="bg-rose-50/50 p-4 rounded-xl mb-5 border border-rose-100/50">
                <label className="text-xs font-bold text-rose-600 uppercase mb-2 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Preencher Automaticamente
                </label>
                <select onChange={(e) => selecionarPagador(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 font-semibold text-slate-700 uppercase appearance-none cursor-pointer">
                  <option value="">Selecione um cliente cadastrado...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome / Razão Social</label>
                  <input value={pagadorNome} onChange={handleInputUppercase(setPagadorNome)} placeholder="Ex: JOÃO DA SILVA" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Documento (CPF/CNPJ)</label>
                  <input value={pagadorDoc} onChange={e => setPagadorDoc(e.target.value)} placeholder="000.000.000-00" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Endereço Completo</label>
                  <textarea rows={2} value={pagadorEnd} onChange={handleInputUppercase(setPagadorEnd)} placeholder="RUA, NÚMERO, BAIRRO..." className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cidade</label>
                    <input value={pagadorCidade} onChange={handleInputUppercase(setPagadorCidade)} placeholder="CASCAVEL" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">UF</label>
                    <input value={pagadorUf} onChange={handleInputUppercase(setPagadorUf)} placeholder="PR" maxLength={2} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: 2. EMITENTE */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 rounded-l-2xl"></div>
              
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                2. Quem Recebe (Emitente)
              </h2>
              
              <div className="bg-blue-50/50 p-4 rounded-xl mb-5 border border-blue-100/50">
                <label className="text-xs font-bold text-blue-600 uppercase mb-2 flex items-center gap-1">
                  <Search className="w-3 h-3" /> Preencher Automaticamente
                </label>
                <select onChange={(e) => selecionarEmitente(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 uppercase appearance-none cursor-pointer">
                  <option value="">Selecione sua empresa...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Sua Empresa / Nome</label>
                  <input value={emitenteNome} onChange={handleInputUppercase(setEmitenteNome)} placeholder="SUA EMPRESA LTDA" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Seu CNPJ / CPF</label>
                  <input value={emitenteDoc} onChange={e => setEmitenteDoc(e.target.value)} placeholder="00.000.000/0001-00" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Endereço Completo</label>
                  <textarea rows={2} value={emitenteEnd} onChange={handleInputUppercase(setEmitenteEnd)} placeholder="RUA, NÚMERO, BAIRRO..." className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cidade Emissão</label>
                    <input value={emitenteCidade} onChange={handleInputUppercase(setEmitenteCidade)} placeholder="NOVA AURORA" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">UF</label>
                    <input value={emitenteUf} onChange={handleInputUppercase(setEmitenteUf)} placeholder="PR" maxLength={2} className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA */}
          <div className="h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 h-full flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>

              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-500" />
                3. Valores e Detalhes
              </h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor Numérico (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={valor} 
                    onChange={e => setValor(e.target.value)} 
                    className="w-full px-4 py-3 bg-emerald-50/30 border border-emerald-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-emerald-700 text-xl outline-none placeholder:text-emerald-300" 
                    placeholder="0.00" 
                  />
                  <p className="text-xs text-emerald-600 mt-2 font-bold uppercase tracking-wide">Extenso: {formatarMoeda(valor)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nº de Controle</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className={inputClass} />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Referente a (Descrição)</label>
                <textarea 
                  rows={3}
                  value={referente} 
                  onChange={handleInputUppercase(setReferente)} 
                  className={`${inputClass} resize-none`}
                  placeholder="EX: PAGAMENTO REFERENTE À MENSALIDADE DA USINA SOLAR..."
                />
              </div>
              
              <div className="mb-10">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Data de Emissão
                </label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className={inputClass} />
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button 
                  onClick={handlePrint} 
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white py-5 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  <Printer className="w-6 h-6" /> 
                  IMPRIMIR RECEBIMENTO
                </button>
                <p className="text-center text-xs text-slate-400 mt-3 font-medium">O recibo será gerado em formato A4 para PDF ou Impressora.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA EMPRESAS */}
      {activeTab === 'empresas' && (
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              Cadastrar Nova Empresa ou Pessoa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Nome Completo / Razão Social</label>
                <input value={novaEmpresa.nome} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, nome: val }))} className={inputClass} placeholder="EX: JOÃO DA SILVA OU EMPRESA LTDA" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">CNPJ / CPF</label>
                <input value={novaEmpresa.cpf_cnpj} onChange={e => setNovaEmpresa({ ...novaEmpresa, cpf_cnpj: e.target.value })} className={inputClass} placeholder="000.000.000-00" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Endereço Completo</label>
                <input value={novaEmpresa.endereco} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, endereco: val }))} className={inputClass} placeholder="RUA, NÚMERO, BAIRRO" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cidade</label>
                <input value={novaEmpresa.cidade} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, cidade: val }))} className={inputClass} placeholder="NOVA AURORA" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">UF</label>
                <input value={novaEmpresa.uf} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, uf: val }))} className={inputClass} placeholder="PR" maxLength={2} />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={salvarNovaEmpresa} 
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 shadow-md shadow-blue-200 hover:-translate-y-0.5 transition-all"
              >
                <Save className="w-5 h-5" /> SALVAR CADASTRO
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-bold text-slate-800">Entidades Cadastradas</h3>
               <p className="text-sm text-slate-500">Estas entidades poderão ser usadas rapidamente na tela de emissão.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-xs border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="p-5">Nome / Razão Social</th>
                    <th className="p-5">Documento</th>
                    <th className="p-5">Localidade</th>
                    <th className="p-5 text-right">Excluir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {empresas.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors uppercase group">
                      <td className="p-5 font-bold text-slate-800">{emp.nome}</td>
                      <td className="p-5 font-medium">{emp.cpf_cnpj || emp.documento || '-'}</td>
                      <td className="p-5 text-slate-500 flex items-center gap-2">
                        {emp.cidade ? <><MapPin className="w-3 h-3"/> {emp.cidade}/{emp.uf}</> : '-'}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={async () => {
                            if (confirm('Tem certeza que deseja excluir este cadastro?')) {
                              await api.entidades.delete(emp.id);
                              carregarDados();
                            }
                          }}
                          className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Excluir Registro"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {empresas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">
                        Nenhuma entidade cadastrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
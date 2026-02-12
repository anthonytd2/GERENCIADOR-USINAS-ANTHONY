import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ArrowLeft, Save, Trash2 } from 'lucide-react';
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
      <div className="border-4 border-black p-8 h-full flex flex-col justify-between relative">

        {/* CABEÇALHO */}
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

        {/* CORPO - TUDO NEGRITO (font-bold) */}
        <div className="space-y-6 text-xl leading-relaxed uppercase font-bold text-black">

          {/* QUEM PAGA */}
          <div className="flex flex-col">
            <div className="flex items-baseline w-full">
              <span className="mr-2 whitespace-nowrap">RECEBI(EMOS) DE:</span>
              <span className="border-b-2 border-black px-2 flex-grow">
                {pagador.nome || ''}
              </span>
            </div>
          </div>

          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">CPF/CNPJ:</span>
            <span className="border-b-2 border-black px-2 flex-grow">
              {pagador.cpf_cnpj || ''}
            </span>
          </div>

          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">ENDEREÇO DO PAGADOR:</span>
            <span className="border-b-2 border-black px-2 flex-grow">
              {pagador.endereco || ''}
            </span>
          </div>

          {/* VALOR POR EXTENSO */}
          <div className="bg-slate-50 p-4 border-2 border-black rounded my-4">
            <span className="text-sm block mb-1">A IMPORTÂNCIA DE:</span>
            <span className="text-lg leading-tight block">
              ({valorExtenso || 'ZERO REAIS'})
            </span>
          </div>

          <div className="flex items-baseline w-full">
            <span className="mr-2 whitespace-nowrap">REFERENTE A:</span>
            <span className="border-b-2 border-black px-2 flex-grow">
              {referente}
            </span>
          </div>

          {/* DADOS DO EMITENTE (INCLUINDO ENDEREÇO AGORA) */}
          <div className="mt-6 pt-4 border-t-2 border-dotted border-black">
            <div className="flex items-baseline w-full">
              <span className="mr-2 whitespace-nowrap">EMITENTE:</span>
              <span className="px-2 flex-grow border-b-2 border-black">
                {emitente.nome} - CNPJ/CPF: {emitente.cpf_cnpj}
              </span>
            </div>
            {/* LINHA NOVA: ENDEREÇO DO EMITENTE */}
            <div className="flex items-baseline w-full mt-2">
              <span className="mr-2 whitespace-nowrap">ENDEREÇO EMITENTE:</span>
              <span className="px-2 flex-grow border-b-2 border-black">
                {emitente.endereco} {emitente.cidade ? `- ${emitente.cidade}/${emitente.uf}` : ''}
              </span>
            </div>
          </div>

        </div>

        {/* RODAPÉ */}
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
      // CORREÇÃO: Tenta ler cpf_cnpj OU documento
      setPagadorDoc(emp.cpf_cnpj || emp.documento || '');
      setPagadorEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
    } else {
      setPagadorNome(''); setPagadorDoc(''); setPagadorEnd('');
    }
  };

  const selecionarEmitente = (id: string) => {
    const emp = empresas.find(e => e.id.toString() === id);
    if (emp) {
      setEmitenteNome(emp.nome.toUpperCase());
      // CORREÇÃO: Tenta ler cpf_cnpj OU documento
      setEmitenteDoc(emp.cpf_cnpj || emp.documento || '');
      setEmitenteEnd(emp.endereco ? emp.endereco.toUpperCase() : '');
      if (emp.cidade) setEmitenteCidade(emp.cidade.toUpperCase());
      if (emp.uf) setEmitenteUf(emp.uf.toUpperCase());
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

  return (
    <div className="p-6 min-h-screen bg-slate-50">

      {/* IMPRESSÃO INVISÍVEL */}
      <div style={{ display: 'none' }}>
        <ReciboTemplate
          ref={componentRef}
          numero={numero}
          valor={valor}
          pagador={{ nome: pagadorNome, cpf_cnpj: pagadorDoc, endereco: pagadorEnd }}
          emitente={{ nome: emitenteNome, cpf_cnpj: emitenteDoc, endereco: emitenteEnd, cidade: emitenteCidade, uf: emitenteUf }}
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

      {activeTab === 'emitir' && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-xl"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">1. Quem Paga (Pagador)</h2>
              <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar da Lista</label>
                <select onChange={(e) => selecionarPagador(e.target.value)} className="w-full p-2 border rounded bg-white uppercase text-sm font-bold">
                  <option value="">Selecione...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <input value={pagadorNome} onChange={handleInputUppercase(setPagadorNome)} placeholder="NOME DO PAGADOR" className="w-full p-2 border rounded uppercase font-bold" />
                <input value={pagadorDoc} onChange={e => setPagadorDoc(e.target.value)} placeholder="CPF / CNPJ" className="w-full p-2 border rounded uppercase font-bold" />
                <textarea rows={2} value={pagadorEnd} onChange={handleInputUppercase(setPagadorEnd)} placeholder="ENDEREÇO COMPLETO" className="w-full p-2 border rounded uppercase font-bold" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl"></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">2. Quem Recebe (Emitente)</h2>
              <div className="bg-slate-50 p-3 rounded mb-4 border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Buscar da Lista</label>
                <select onChange={(e) => selecionarEmitente(e.target.value)} className="w-full p-2 border rounded bg-white uppercase text-sm font-bold">
                  <option value="">Selecione...</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <input value={emitenteNome} onChange={handleInputUppercase(setEmitenteNome)} placeholder="NOME DO EMITENTE" className="w-full p-2 border rounded bg-blue-50 uppercase font-bold" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={emitenteDoc} onChange={e => setEmitenteDoc(e.target.value)} placeholder="CNPJ/CPF" className="w-full p-2 border rounded bg-blue-50 uppercase font-bold" />
                  <input value={emitenteCidade} onChange={handleInputUppercase(setEmitenteCidade)} placeholder="CIDADE" className="w-full p-2 border rounded uppercase font-bold" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">3. Detalhes do Recibo</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full p-3 border rounded text-lg font-bold" placeholder="0.00" />
                  <p className="text-sm text-green-600 mt-1 font-bold">{formatarMoeda(valor)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nº Recibo</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-3 border rounded font-bold" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 mb-1">Referente a</label>
                <input type="text" value={referente} onChange={handleInputUppercase(setReferente)} className="w-full p-3 border rounded uppercase font-bold" />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-600 mb-1">Data de Emissão</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full p-3 border rounded font-bold" />
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

      {activeTab === 'empresas' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Cadastrar Empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Nome</label>
                <input value={novaEmpresa.nome} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, nome: val }))} className="w-full p-2 border rounded uppercase" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">CNPJ / CPF</label>
                <input value={novaEmpresa.cpf_cnpj} onChange={e => setNovaEmpresa({ ...novaEmpresa, cpf_cnpj: e.target.value })} className="w-full p-2 border rounded uppercase" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-600 mb-1">Endereço</label>
                <input value={novaEmpresa.endereco} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, endereco: val }))} className="w-full p-2 border rounded uppercase" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Cidade</label>
                <input value={novaEmpresa.cidade} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, cidade: val }))} className="w-full p-2 border rounded uppercase" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">UF</label>
                <input value={novaEmpresa.uf} onChange={handleInputUppercase((val: string) => setNovaEmpresa({ ...novaEmpresa, uf: val }))} className="w-full p-2 border rounded uppercase" maxLength={2} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={salvarNovaEmpresa} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium flex items-center gap-2">
                <Save className="w-4 h-4" /> SALVAR
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-semibold border-b">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">cpf_cnpj</th>
                  <th className="p-4">Cidade/UF</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => (
                  <tr key={emp.id} className="border-b hover:bg-slate-50 uppercase">
                    <td className="p-4 font-bold text-slate-900">{emp.nome}</td>
                    <td className="p-4">{emp.cpf_cnpj || emp.documento}</td>
                    <td className="p-4">{emp.cidade}/{emp.uf}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={async () => {
                          if (confirm('Excluir empresa?')) {
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
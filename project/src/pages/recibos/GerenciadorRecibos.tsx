import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GerenciadorRecibos() {
  // --- ESTADOS DO FORMULÁRIO ---
  const [numero, setNumero] = useState('1');
  const [valor, setValor] = useState('');
  
  // DADOS DE QUEM PAGA (O CLIENTE)
  const [pagadorNome, setPagadorNome] = useState('');
  const [pagadorDoc, setPagadorDoc] = useState(''); // CPF ou CNPJ
  const [endereco, setEndereco] = useState('');
  
  // DADOS DO SERVIÇO
  const [referente, setReferente] = useState('LOCAÇÃO DE USINA SOLAR');
  const [cidade, setCidade] = useState('NOVA AURORA');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); // Hoje

  // DADOS DO EMITENTE (VOCÊ / SUA EMPRESA) - Agora editáveis
  const [emitenteNome, setEmitenteNome] = useState('SOLAR LOCAÇÕES LTDA');
  const [emitenteDoc, setEmitenteDoc] = useState('52.577.862/0001-85');

  // Ref para impressão
  const componentRef = useRef(null);

const handlePrint = useReactToPrint({
    contentRef: componentRef, // <--- O jeito novo (se a versão for a mais atual)
    documentTitle: `Recibo_${numero}`,
  });

  // --- FORMATAÇÃO DE MOEDA (R$ 4.438,06) ---
  const formatarMoeda = (valorInput: string) => {
    if (!valorInput) return 'R$ 0,00';
    const numero = parseFloat(valorInput);
    if (isNaN(numero)) return 'R$ 0,00';
    
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // --- FORMATAÇÃO DE DATA (DD/MM/AAAA) ---
  const formatarData = (dataInput: string) => {
    if (!dataInput) return '';
    const [ano, mes, dia] = dataInput.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      {/* CABEÇALHO DA TELA */}
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
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Printer className="w-5 h-5" />
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LADO ESQUERDO: FORMULÁRIO DE PREENCHIMENTO --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit overflow-y-auto max-h-[85vh]">
          <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">1. Dados do Recibo</h2>
          
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nº do Recibo</label>
                <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Valor (Numérico)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 4438.06"
                  value={valor} 
                  onChange={e => setValor(e.target.value)} 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                />
                <p className="text-xs text-blue-600 mt-1 font-semibold">
                  {formatarMoeda(valor)}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Pagador (Nome)</label>
              <input type="text" placeholder="Quem está pagando..." value={pagadorNome} onChange={e => setPagadorNome(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">CPF / CNPJ do Pagador</label>
              <input type="text" value={pagadorDoc} onChange={e => setPagadorDoc(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Endereço do Pagador</label>
              <textarea rows={2} value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Referente a</label>
              <input type="text" value={referente} onChange={e => setReferente(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2 pt-2">2. Dados da Assinatura (Emitente)</h2>
          
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Cidade</label>
                <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome de quem Assina (Empresa/Pessoa)</label>
              <input type="text" value={emitenteNome} onChange={e => setEmitenteNome(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-yellow-50" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">CPF/CNPJ de quem Assina</label>
              <input type="text" value={emitenteDoc} onChange={e => setEmitenteDoc(e.target.value)} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-yellow-50" />
            </div>
          </div>
        </div>

        {/* --- LADO DIREITO: PRÉ-VISUALIZAÇÃO DO RECIBO --- */}
        <div className="flex justify-center bg-slate-200 p-8 rounded-xl overflow-auto items-start">
          
          {/* ÁREA DE IMPRESSÃO (Folha A4 simulada ou tamanho Recibo) */}
          <div 
            ref={componentRef} 
            className="bg-white p-10 shadow-2xl text-black font-serif print:shadow-none"
            style={{ 
              width: '210mm', // Largura A4 padrão
              minHeight: '148mm', // Metade de um A4 (A5 horizontal)
              border: '1px solid #ccc'
            }}
          >
            {/* BORDA DECORATIVA DO RECIBO */}
            <div className="border-4 border-double border-slate-800 p-8 h-full relative flex flex-col justify-between">
              
              {/* CABEÇALHO DO RECIBO */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-widest text-slate-900">RECIBO</h1>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2 justify-end">
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

              {/* CORPO DO RECIBO */}
              <div className="space-y-6 text-lg leading-relaxed">
                
                {/* LINHA 1: RECEBI DE */}
                <div>
                  <span className="font-bold mr-2">RECEBI(EMOS) DE:</span>
                  <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2">
                    {pagadorNome || '__________________________________________________'}
                  </span>
                </div>

                {/* LINHA 2: CPF/CNPJ */}
                <div>
                  <span className="font-bold mr-2">CPF/CNPJ nº:</span>
                  <span className="border-b border-dotted border-slate-400 font-medium px-2">
                    {pagadorDoc || '____________________'}
                  </span>
                </div>

                 {/* LINHA 3: ENDEREÇO */}
                 <div>
                  <span className="font-bold mr-2">ENDEREÇO:</span>
                  <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2 w-full inline-block">
                    {endereco || '__________________________________________________________________'}
                  </span>
                </div>

                {/* LINHA 4: IMPORTÂNCIA */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded italic mt-4 mb-4">
                  <span className="font-bold not-italic mr-2">A IMPORTÂNCIA DE:</span>
                  <span className="font-bold text-xl uppercase">
                    ({formatarMoeda(valor)})
                  </span>
                </div>

                {/* LINHA 5: REFERENTE A */}
                <div>
                  <span className="font-bold mr-2">REFERENTE A:</span>
                  <span className="border-b border-dotted border-slate-400 font-medium uppercase px-2 w-full inline-block">
                    {referente}
                  </span>
                </div>
              </div>

              {/* RODAPÉ: DATA E ASSINATURA */}
              <div className="mt-12 flex flex-col items-center">
                <p className="text-right w-full mb-12 text-lg">
                  {cidade.toUpperCase()}, <span className="font-bold">{formatarData(data)}</span>.
                </p>

                <div className="text-center w-2/3">
                  <div className="border-b border-slate-800 mb-2"></div>
                  {/* AQUI ESTÁ A MUDANÇA: CAMPOS DINÂMICOS */}
                  <p className="font-bold text-lg uppercase">{emitenteNome || 'NOME DO EMITENTE'}</p>
                  <p className="text-sm text-slate-600">CNPJ/CPF: {emitenteDoc || '00.000.000/0000-00'}</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
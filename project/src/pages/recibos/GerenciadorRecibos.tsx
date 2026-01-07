import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { jsPDF } from 'jspdf';
import { Printer, Plus, Trash2, Building2, FileText, Save } from 'lucide-react';

export default function GerenciadorRecibos() {
  const [activeTab, setActiveTab] = useState<'gerador' | 'cadastros'>('gerador');
  const [entidades, setEntidades] = useState<any[]>([]);
  
  // ESTADOS DO GERADOR DE RECIBO
  const [recibo, setRecibo] = useState({
    PagadorID: '',
    RecebedorID: '',
    Valor: '',
    Numero: '',
    DataEmissao: new Date().toISOString().split('T')[0],
    ReferenteA: 'LOCAÇÃO DE USINA SOLAR'
  });

  // ESTADOS DO CADASTRO DE EMPRESA
  const [novaEntidade, setNovaEntidade] = useState({
    Nome: '', Documento: '', Endereco: '', Cidade: '', UF: ''
  });

  const loadEntidades = () => {
    api.entidades.list().then(setEntidades);
  };

  useEffect(() => {
    loadEntidades();
  }, []);

  // === FUNÇÃO DE IMPRESSÃO (IGUAL AO ANTERIOR, MAS FLEXÍVEL) ===
  const handlePrint = () => {
    const pagador = entidades.find(e => e.EntidadeID === Number(recibo.PagadorID));
    const recebedor = entidades.find(e => e.EntidadeID === Number(recibo.RecebedorID));

    if (!pagador || !recebedor || !recibo.Valor) {
      alert("Selecione quem paga, quem recebe e o valor.");
      return;
    }

    const doc = new jsPDF();
    doc.setFont("helvetica");

    // TÍTULO
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RECIBO Nº ${recibo.Numero}`, 105, 20, { align: "center" });

    // VALOR
    doc.setFontSize(14);
    doc.rect(140, 30, 50, 10);
    doc.text(`R$ ${Number(recibo.Valor).toFixed(2).replace('.', ',')}`, 165, 37, { align: "center" });

    // CORPO
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 60;

    // RECEBI DE...
    doc.text("RECEBI (EMOS) DE:", 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(pagador.Nome.toUpperCase(), 65, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    if (pagador.Documento) {
        doc.text(`CPF/CNPJ: ${pagador.Documento}`, 65, y);
        y += 10;
    } else { y += 3; }

    doc.text("ENDEREÇO:", 20, y);
    doc.text(`${pagador.Endereco || ''}, ${pagador.Cidade || ''}/${pagador.UF || ''}`, 65, y, { maxWidth: 130 });
    y += 15;

    doc.text("A IMPORTÂNCIA DE:", 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(`R$ ${Number(recibo.Valor).toFixed(2).replace('.', ',')}`, 65, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.text("REFERENTE A:", 20, y);
    doc.text(recibo.ReferenteA.toUpperCase(), 65, y, { maxWidth: 130 });
    y += 20;

    // DATA E ASSINATURA
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 10;
    
    const [ano, mes, dia] = recibo.DataEmissao.split('-');
    doc.text(`${recebedor.Cidade || 'Local'}, ${dia}/${mes}/${ano}.`, 105, y, { align: "center" });
    y += 30;

    doc.line(60, y, 150, y);
    y += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text(recebedor.Nome.toUpperCase(), 105, y, { align: "center" });
    y += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`CPF/CNPJ: ${recebedor.Documento || ''}`, 105, y, { align: "center" });
    
    doc.save(`Recibo_${recibo.Numero}.pdf`);
  };

  const handleSaveEntidade = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.entidades.create(novaEntidade);
    setNovaEntidade({ Nome: '', Documento: '', Endereco: '', Cidade: '', UF: '' });
    loadEntidades();
    alert('Cadastro salvo!');
  };

  const handleDeleteEntidade = async (id: number) => {
    if(!confirm("Excluir cadastro?")) return;
    await api.entidades.delete(id);
    loadEntidades();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0B1E3F] mb-6">Emissor de Recibos</h1>

      {/* ABAS */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('gerador')}
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'gerador' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Printer className="w-4 h-4 inline mr-2" /> Gerar Recibo
        </button>
        <button 
          onClick={() => setActiveTab('cadastros')}
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'cadastros' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Building2 className="w-4 h-4 inline mr-2" /> Cadastrar Empresas/Pessoas
        </button>
      </div>

      {activeTab === 'gerador' ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            <div className="col-span-2 md:col-span-1 bg-red-50 p-4 rounded-lg border border-red-100">
              <label className="block text-sm font-bold text-red-800 mb-2">Quem Paga? (Recebemos de)</label>
              <select 
                className="w-full rounded-lg border-red-200 focus:ring-red-500"
                value={recibo.PagadorID}
                onChange={e => setRecibo({...recibo, PagadorID: e.target.value})}
              >
                <option value="">Selecione...</option>
                {entidades.map(e => <option key={e.EntidadeID} value={e.EntidadeID}>{e.Nome}</option>)}
              </select>
            </div>

            <div className="col-span-2 md:col-span-1 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-sm font-bold text-blue-800 mb-2">Quem Assina? (Emitente)</label>
              <select 
                className="w-full rounded-lg border-blue-200 focus:ring-blue-500"
                value={recibo.RecebedorID}
                onChange={e => setRecibo({...recibo, RecebedorID: e.target.value})}
              >
                <option value="">Selecione...</option>
                {entidades.map(e => <option key={e.EntidadeID} value={e.EntidadeID}>{e.Nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
              <input 
                type="number" step="0.01" 
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 text-lg font-bold text-gray-800"
                value={recibo.Valor}
                onChange={e => setRecibo({...recibo, Valor: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do Recibo</label>
              <input 
                type="text" 
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                value={recibo.Numero}
                onChange={e => setRecibo({...recibo, Numero: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Recibo</label>
              <input 
                type="date" 
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                value={recibo.DataEmissao}
                onChange={e => setRecibo({...recibo, DataEmissao: e.target.value})}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Referente a</label>
              <input 
                type="text" 
                className="w-full rounded-lg border-gray-300 focus:ring-blue-500"
                value={recibo.ReferenteA}
                onChange={e => setRecibo({...recibo, ReferenteA: e.target.value})}
              />
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 font-bold text-lg shadow-lg shadow-blue-900/20 transition-transform active:scale-95"
          >
            <Printer className="w-6 h-6" /> Gerar PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORMULÁRIO DE CADASTRO */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Novo Cadastro</h3>
            <form onSubmit={handleSaveEntidade} className="space-y-4">
              <input type="text" placeholder="Nome / Razão Social" required className="w-full rounded-lg border-gray-300" 
                value={novaEntidade.Nome} onChange={e => setNovaEntidade({...novaEntidade, Nome: e.target.value})} />
              
              <input type="text" placeholder="CPF / CNPJ" className="w-full rounded-lg border-gray-300" 
                value={novaEntidade.Documento} onChange={e => setNovaEntidade({...novaEntidade, Documento: e.target.value})} />
              
              <input type="text" placeholder="Endereço" className="w-full rounded-lg border-gray-300" 
                value={novaEntidade.Endereco} onChange={e => setNovaEntidade({...novaEntidade, Endereco: e.target.value})} />
              
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                    <input type="text" placeholder="Cidade" className="w-full rounded-lg border-gray-300" 
                        value={novaEntidade.Cidade} onChange={e => setNovaEntidade({...novaEntidade, Cidade: e.target.value})} />
                </div>
                <div>
                    <input type="text" placeholder="UF" maxLength={2} className="w-full rounded-lg border-gray-300" 
                        value={novaEntidade.UF} onChange={e => setNovaEntidade({...novaEntidade, UF: e.target.value.toUpperCase()})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Salvar
              </button>
            </form>
          </div>

          {/* LISTA DE CADASTROS */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Documento</th>
                  <th className="px-6 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entidades.map(ent => (
                  <tr key={ent.EntidadeID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{ent.Nome}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{ent.Documento}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteEntidade(ent.EntidadeID)} className="text-red-400 hover:text-red-600">
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
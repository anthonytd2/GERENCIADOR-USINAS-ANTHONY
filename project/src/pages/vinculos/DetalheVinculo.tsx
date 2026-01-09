import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, Plus, Save, X, FileSpreadsheet, Paperclip, CheckCircle, FileText, Info } from 'lucide-react';

export default function DetalheVinculo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vinculo, setVinculo] = useState<any>(null);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals e Forms
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadingPlanilha, setUploadingPlanilha] = useState(false);
  const [uploadingRecibo, setUploadingRecibo] = useState(false);
  const [form, setForm] = useState({ MesReferencia: '', EnergiaCompensada: '', ValorRecebido: '', ValorPago: '', Spread: '', ArquivoURL: '', ReciboURL: '' });

  useEffect(() => {
    if (id) {
      api.vinculos.get(Number(id)).then(setVinculo).catch(console.error);
      api.fechamentos.list(Number(id)).then(res => setRelatorios(Array.isArray(res) ? res : [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await api.fechamentos.update(editingId, form);
      else await api.fechamentos.create({ VinculoID: Number(id), ...form });
      setShowModal(false); setEditingId(null); setForm({ MesReferencia: '', EnergiaCompensada: '', ValorRecebido: '', ValorPago: '', Spread: '', ArquivoURL: '', ReciboURL: '' });
      const r = await api.fechamentos.list(Number(id)); setRelatorios(Array.isArray(r) ? r : []);
    } catch (error) { alert('Erro ao salvar.'); }
  };
  
  // Funções auxiliares (Upload, Delete, Calc) simplificadas para caber
  const handleCalc = (r:string, p:string) => setForm(prev => ({...prev, ValorRecebido:r, ValorPago:p, Spread:( (parseFloat(r)||0)-(parseFloat(p)||0) ).toFixed(2)}));
  const handleDelRel = async(rid:number) => { if(confirm('Excluir?')) { await api.fechamentos.delete(rid); const r = await api.fechamentos.list(Number(id)); setRelatorios(r); }};
  const handleDelVinc = async() => { if(confirm('Excluir vínculo?')) { await api.vinculos.delete(Number(id)); navigate('/vinculos'); }};
  const handleUpload = async (e: any, type: 'planilha'|'recibo') => {
    const file = e.target.files[0]; if(!file) return;
    if(type==='planilha') setUploadingPlanilha(true); else setUploadingRecibo(true);
    try {
       const name = `${type}_${id}_${Date.now()}_${file.name}`;
       await supabaseClient.storage.from('comprovantes').upload(name, file);
       const { data } = supabaseClient.storage.from('comprovantes').getPublicUrl(name);
       setForm(prev => ({...prev, [type==='planilha'?'ArquivoURL':'ReciboURL']: data.publicUrl }));
    } catch(e) { alert('Erro upload'); } finally { setUploadingPlanilha(false); setUploadingRecibo(false); }
  };
  const openEdit = (rel:any) => {
    setEditingId(rel.fechamentoid || rel.FechamentoID);
    setForm({
        MesReferencia: rel.mesreferencia||rel.MesReferencia, EnergiaCompensada: rel.energiacompensada||rel.EnergiaCompensada,
        ValorRecebido: rel.valorrecebido||rel.ValorRecebido, ValorPago: rel.valorpago||rel.ValorPago, Spread: rel.spread||rel.Spread,
        ArquivoURL: rel.arquivourl||rel.ArquivoURL||'', ReciboURL: rel.recibourl||rel.ReciboURL||''
    }); setShowModal(true);
  };

  if (loading) return <div className="p-8">Carregando...</div>;
  if (!vinculo) return <div className="p-8">Não encontrado</div>;

  // Variáveis para exibição segura
  const nomeConsumidor = vinculo.consumidores?.nome || vinculo.Consumidores?.Nome || 'Consumidor';
  const nomeUsina = vinculo.usinas?.nomeproprietario || vinculo.Usinas?.NomeProprietario || 'N/A';
  const statusDesc = vinculo.status?.descricao || vinculo.Status?.Descricao || 'N/A';
  const obs = vinculo.observacao || vinculo.Observacao;

  return (
    <div>
      <div className="mb-6 flex justify-between"><Link to="/vinculos" className="flex items-center gap-2 text-gray-500"><ArrowLeft className="w-4 h-4"/> Voltar</Link> 
        <div className="flex gap-2"><Link to={`/vinculos/${id}/editar`} className="px-3 py-2 bg-gray-100 rounded"><Edit className="w-4 h-4"/></Link>
        <button onClick={handleDelVinc} className="px-3 py-2 bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
        <h1 className="text-2xl font-bold text-[#0B1E3F]">{nomeConsumidor}</h1>
        <p className="text-lg text-gray-600 mt-1">Usina: <span className="font-semibold">{nomeUsina}</span></p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">{statusDesc}</div>
        {obs && <div className="mt-6 pt-6 border-t border-gray-100"><h3 className="text-sm font-semibold text-gray-500 uppercase flex items-center gap-2 mb-2"><Info className="w-4 h-4"/> Observações</h3><div className="bg-gray-50 p-4 rounded text-gray-700 whitespace-pre-wrap">{obs}</div></div>}
      </div>

      <div className="flex justify-between items-end mb-4"><h2 className="text-xl font-bold text-[#0B1E3F] flex items-center gap-2"><DollarSign className="w-6 h-6 text-blue-600"/> Histórico Financeiro</h2>
        <button onClick={()=>{setShowModal(true); setEditingId(null); setForm({MesReferencia:'',EnergiaCompensada:'',ValorRecebido:'',ValorPago:'',Spread:'',ArquivoURL:'',ReciboURL:''})}} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus className="w-4 h-4"/> Novo</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mês</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Energia</th><th className="px-6 py-3 text-left text-xs font-bold text-blue-600 uppercase">Recebido</th><th className="px-6 py-3 text-left text-xs font-bold text-red-600 uppercase">Pago</th><th className="px-6 py-3 text-left text-xs font-bold text-green-600 uppercase">Lucro</th><th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Docs</th><th className="px-6 py-3"></th></tr></thead>
          <tbody className="divide-y divide-gray-200">{relatorios.map((rel)=>(
            <tr key={rel.fechamentoid||rel.FechamentoID} className="hover:bg-gray-50">
              <td className="px-6 py-4">{rel.mesreferencia||rel.MesReferencia}</td><td className="px-6 py-4">{rel.energiacompensada||rel.EnergiaCompensada} kWh</td>
              <td className="px-6 py-4 text-blue-700">R$ {rel.valorrecebido||rel.ValorRecebido}</td><td className="px-6 py-4 text-red-700">R$ {rel.valorpago||rel.ValorPago}</td><td className="px-6 py-4 text-green-700 font-bold">R$ {rel.spread||rel.Spread}</td>
              <td className="px-6 py-4 text-center space-x-2">
                {(rel.arquivourl||rel.ArquivoURL)&&<a href={rel.arquivourl||rel.ArquivoURL} target="_blank" className="text-blue-600"><FileSpreadsheet className="w-5 h-5"/></a>}
                {(rel.recibourl||rel.ReciboURL)&&<a href={rel.recibourl||rel.ReciboURL} target="_blank" className="text-green-600"><FileText className="w-5 h-5"/></a>}
              </td>
              <td className="px-6 py-4 text-right"><button onClick={()=>openEdit(rel)} className="text-blue-400 mr-2"><Edit className="w-4 h-4"/></button><button onClick={()=>handleDelRel(rel.fechamentoid||rel.FechamentoID)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></td>
            </tr>
          ))}</tbody></table>
      </div>

      {showModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
         <div className="flex justify-between mb-4"><h3 className="font-bold text-xl">{editingId?'Editar':'Novo'} Lançamento</h3><button onClick={()=>setShowModal(false)}><X/></button></div>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium">Mês</label><input type="month" required className="w-full border rounded p-2" value={form.MesReferencia} onChange={e=>setForm({...form,MesReferencia:e.target.value})}/></div>
              <div><label className="block text-sm font-medium">Energia (kWh)</label><input type="number" required className="w-full border rounded p-2" value={form.EnergiaCompensada} onChange={e=>setForm({...form,EnergiaCompensada:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border">
              <div><label className="block text-sm font-bold text-blue-700">Recebido</label><input type="number" step="0.01" required className="w-full border p-2" value={form.ValorRecebido} onChange={e=>handleCalc(e.target.value,form.ValorPago)}/></div>
              <div><label className="block text-sm font-bold text-red-700">Pago</label><input type="number" step="0.01" required className="w-full border p-2" value={form.ValorPago} onChange={e=>handleCalc(form.ValorRecebido,e.target.value)}/></div>
            </div>
            <div><label className="block text-sm font-medium">1. Planilha</label><div className="flex gap-2 items-center border p-2 rounded cursor-pointer relative"><Paperclip className="w-4 h-4"/><span className="text-sm">{uploadingPlanilha?'Enviando...':form.ArquivoURL?'Anexado':'Escolher'}</span><input type="file" className="absolute inset-0 opacity-0" onChange={e=>handleUpload(e,'planilha')} disabled={uploadingPlanilha}/>{form.ArquivoURL&&<CheckCircle className="w-4 h-4 text-green-500"/>}</div></div>
            <div><label className="block text-sm font-medium">2. Recibo</label><div className="flex gap-2 items-center border p-2 rounded cursor-pointer relative"><FileText className="w-4 h-4"/><span className="text-sm">{uploadingRecibo?'Enviando...':form.ReciboURL?'Anexado':'Escolher'}</span><input type="file" className="absolute inset-0 opacity-0" onChange={e=>handleUpload(e,'recibo')} disabled={uploadingRecibo}/>{form.ReciboURL&&<CheckCircle className="w-4 h-4 text-green-500"/>}</div></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button></div>
         </form>
      </div></div>}
    </div>
  );
}
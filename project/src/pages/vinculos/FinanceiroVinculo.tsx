import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient } from '../../lib/supabaseClient'; 

import { 
  ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, 
  Edit2, Save, X, CheckCircle, Calculator
} from 'lucide-react';

interface Fechamento {
  fechamentoid: number;
  mesreferencia: string;
  energiacompensada: number;
  valorrecebido: number;
  valorpago: number;
  spread: number;
  tarifa_energia?: number; // Novo
  custo_fio_b?: number;    // Novo
  impostos_taxas?: number; // Novo
  arquivourl?: string;
  recibourl?: string;
}

export default function FinanceiroVinculo() {
  const { id } = useParams();
  
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    mesreferencia: '',
    energiacompensada: '',
    tarifa_energia: '', // Novo: Preço do kW
    custo_fio_b: '',    // Novo: Custo Fio B
    impostos_taxas: '', // Novo: Ilum. Pub + Taxas
    valorrecebido: '',
    valorpago: '',      // Agora calculado automaticamente
    spread: '',
    arquivo: null as File | null,
    recibo: null as File | null,
    arquivourl_existente: null as string | null,
    recibourl_existente: null as string | null
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dados = await api.fechamentos.list(Number(id));
      setFechamentos(dados || []);
    } catch (e: any) {
      console.error(e);
      if (e.message && !e.message.includes('JSON')) {
         alert('Aviso: Não foi possível carregar o histórico financeiro.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) carregarDados(); }, [id]);

  // --- CÉREBRO DA PLANILHA (CÁLCULOS AUTOMÁTICOS) ---
  useEffect(() => {
    const energia = parseFloat(formData.energiacompensada) || 0;
    const tarifa = parseFloat(formData.tarifa_energia) || 0;
    const fioB = parseFloat(formData.custo_fio_b) || 0;
    const taxas = parseFloat(formData.impostos_taxas) || 0;
    
    // 1. Calcula o Total Bruto (Gerador)
    const totalBruto = energia * tarifa;

    // 2. Calcula o Líquido a Pagar (Desconta Fio B e Taxas)
    // Se o usuário não digitou manualmente um valor pago, sugerimos o calculado
    if (!editingId) { // Só sugere em novos lançamentos para não sobrescrever edições
        const liquidoSugerido = totalBruto - fioB - taxas;
        // Atualiza o campo 'valorpago' apenas se ele estiver vazio ou se estivermos digitando os custos
        // (Lógica simplificada: sempre atualiza o sugerido para facilitar)
        if (totalBruto > 0) {
            setFormData(prev => ({ 
                ...prev, 
                valorpago: liquidoSugerido > 0 ? liquidoSugerido.toFixed(2) : '0.00' 
            }));
        }
    }

  }, [formData.energiacompensada, formData.tarifa_energia, formData.custo_fio_b, formData.impostos_taxas]);

  // Calcula o Spread Final (Recebido - Pago)
  useEffect(() => {
    const recebido = parseFloat(formData.valorrecebido) || 0;
    const pago = parseFloat(formData.valorpago) || 0;
    setFormData(prev => ({ ...prev, spread: (recebido - pago).toFixed(2) }));
  }, [formData.valorrecebido, formData.valorpago]);
  // --------------------------------------------------

  const uploadArquivo = async (file: File, bucket: string) => {
    const nome = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(nome, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(nome);
    return data.publicUrl;
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let urlArq = formData.arquivourl_existente;
      let urlRec = formData.recibourl_existente;
      if (formData.arquivo) urlArq = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) urlRec = await uploadArquivo(formData.recibo, 'comprovantes');

      const payload = {
        MesReferencia: formData.mesreferencia,
        EnergiaCompensada: Number(formData.energiacompensada),
        valorrecebido: Number(formData.valorrecebido),
        valorpago: Number(formData.valorpago),
        spread: Number(formData.spread),
        // Novos Campos
        tarifa_energia: Number(formData.tarifa_energia),
        custo_fio_b: Number(formData.custo_fio_b),
        impostos_taxas: Number(formData.impostos_taxas),
        
        ArquivoURL: urlArq,
        ReciboURL: urlRec,
        VinculoID: Number(id)
      };

      if (editingId) await api.fechamentos.update(editingId, payload);
      else await api.fechamentos.create(payload);

      setShowForm(false);
      setEditingId(null);
      // Reseta o form
      setFormData({ 
        mesreferencia: '', energiacompensada: '', tarifa_energia: '', custo_fio_b: '', impostos_taxas: '',
        valorrecebido: '', valorpago: '', spread: '', 
        arquivo: null, recibo: null, arquivourl_existente: null, recibourl_existente: null 
      });
      carregarDados();
      alert('Salvo com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleExcluir = async (fid: number) => {
    if (confirm('Excluir lançamento?')) {
      await api.fechamentos.delete(fid);
      carregarDados();
    }
  };

  const handleEditar = (item: Fechamento) => {
    setEditingId(item.fechamentoid);
    setFormData({
      mesreferencia: item.mesreferencia ? item.mesreferencia.split('T')[0] : '',
      energiacompensada: String(item.energiacompensada),
      // Carrega os novos campos
      tarifa_energia: item.tarifa_energia ? String(item.tarifa_energia) : '',
      custo_fio_b: item.custo_fio_b ? String(item.custo_fio_b) : '',
      impostos_taxas: item.impostos_taxas ? String(item.impostos_taxas) : '',
      
      valorrecebido: String(item.valorrecebido),
      valorpago: String(item.valorpago),
      spread: String(item.spread),
      arquivo: null, recibo: null,
      arquivourl_existente: item.arquivourl || null,
      recibourl_existente: item.recibourl || null
    });
    setShowForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to={`/vinculos/${id}`} className="p-2 bg-gray-100 rounded-full"><ArrowLeft size={20}/></Link>
          <h1 className="text-2xl font-bold">Histórico Financeiro</h1>
        </div>
        {!showForm && <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2"><DollarSign size={20}/> Novo Lançamento</button>}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-fade-in">
          <div className="flex justify-between mb-4 border-b pb-2">
            <h3 className="font-bold text-lg flex gap-2"><Calculator size={20} className="text-blue-600"/> Calculadora de Repasse</h3>
            <button onClick={() => setShowForm(false)}><X/></button>
          </div>
          
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Bloco 1: Dados Básicos */}
            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Mês Ref.</label>
              <input required type="date" className="w-full border rounded p-2" value={formData.mesreferencia} onChange={e => setFormData({...formData, mesreferencia: e.target.value})} />
            </div>
            
            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Energia (kWh)</label>
              <input required type="number" className="w-full border rounded p-2 font-bold" placeholder="0" value={formData.energiacompensada} onChange={e => setFormData({...formData, energiacompensada: e.target.value})} />
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Tarifa (R$/kWh)</label>
              <input required type="number" step="0.0001" className="w-full border rounded p-2" placeholder="0.0000" value={formData.tarifa_energia} onChange={e => setFormData({...formData, tarifa_energia: e.target.value})} />
            </div>
            
            {/* Display do Bruto (Apenas Visual) */}
            <div className="lg:col-span-1 bg-gray-50 rounded p-2 border flex flex-col justify-center">
               <span className="text-xs text-gray-400 uppercase">Total Bruto (Estimado)</span>
               <span className="font-bold text-gray-700">R$ {((parseFloat(formData.energiacompensada)||0) * (parseFloat(formData.tarifa_energia)||0)).toFixed(2)}</span>
            </div>

            {/* Bloco 2: Descontos do Gerador */}
            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-red-500 uppercase">Custo Fio B (R$)</label>
              <input type="number" step="0.01" className="w-full border rounded p-2 text-red-700" placeholder="0.00" value={formData.custo_fio_b} onChange={e => setFormData({...formData, custo_fio_b: e.target.value})} />
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-red-500 uppercase">Impostos/Taxas (R$)</label>
              <input type="number" step="0.01" className="w-full border rounded p-2 text-red-700" placeholder="0.00" value={formData.impostos_taxas} onChange={e => setFormData({...formData, impostos_taxas: e.target.value})} />
            </div>

            {/* Bloco 3: Resultados Finais */}
            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-red-700 uppercase">A Pagar (Gerador)</label>
              <input required type="number" step="0.01" className="w-full border-2 border-red-100 rounded p-2 text-red-700 font-bold bg-red-50" 
                value={formData.valorpago} onChange={e => setFormData({...formData, valorpago: e.target.value})} />
              <p className="text-[10px] text-gray-400 mt-1">*Calculado automaticamente</p>
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-green-700 uppercase">A Receber (Cliente)</label>
              <input required type="number" step="0.01" className="w-full border-2 border-green-100 rounded p-2 text-green-700 font-bold bg-green-50" 
                placeholder="0.00" value={formData.valorrecebido} onChange={e => setFormData({...formData, valorrecebido: e.target.value})} />
            </div>

            {/* Resultado Final */}
            <div className="lg:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-200 flex justify-between items-center mt-2">
              <div>
                <span className="text-sm font-bold text-blue-800 block">LUCRO FINAL (SPREAD)</span>
                <span className="text-xs text-blue-600">Recebido - Pago</span>
              </div>
              <span className="text-2xl font-bold text-blue-900">R$ {formData.spread || '0.00'}</span>
            </div>

            {/* Uploads */}
            <div className="lg:col-span-2 border p-2 rounded border-dashed mt-2">
              <label className="block text-sm mb-1">Fatura</label>
              {formData.arquivourl_existente ? <span className="text-green-600 text-sm flex gap-2 items-center"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setFormData({...formData, arquivourl_existente: null})} className="text-red-500 font-bold ml-2">X</button></span> : <input type="file" onChange={e => setFormData({...formData, arquivo: e.target.files?.[0] || null})} />}
            </div>
            <div className="lg:col-span-2 border p-2 rounded border-dashed mt-2">
              <label className="block text-sm mb-1">Comprovante</label>
              {formData.recibourl_existente ? <span className="text-green-600 text-sm flex gap-2 items-center"><CheckCircle size={14}/> Anexado <button type="button" onClick={() => setFormData({...formData, recibourl_existente: null})} className="text-red-500 font-bold ml-2">X</button></span> : <input type="file" onChange={e => setFormData({...formData, recibo: e.target.files?.[0] || null})} />}
            </div>

            <div className="lg:col-span-4 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded shadow">{uploading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="p-4">Mês</th>
              <th className="p-4">Energia</th>
              <th className="p-4 hidden md:table-cell">Tarifa</th>
              <th className="p-4 text-green-600">Recebido</th>
              <th className="p-4 text-red-600">Pago</th>
              <th className="p-4 text-blue-600 font-bold">Spread</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fechamentos.map(f => (
              <tr key={f.fechamentoid} className="hover:bg-gray-50">
                <td className="p-4">{new Date(f.mesreferencia).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                <td className="p-4 font-medium">{f.energiacompensada} kWh</td>
                <td className="p-4 hidden md:table-cell text-gray-400">R$ {f.tarifa_energia}</td>
                <td className="p-4 text-green-600">R$ {Number(f.valorrecebido).toFixed(2)}</td>
                <td className="p-4 text-red-600">R$ {Number(f.valorpago).toFixed(2)}</td>
                <td className="p-4 text-blue-600 font-bold bg-blue-50/20">R$ {Number(f.spread).toFixed(2)}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEditar(f)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => handleExcluir(f.fechamentoid)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
            {!loading && fechamentos.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { supabaseClient as supabase } from '../../lib/supabaseClient';
import { ArrowLeft, FileText, Upload, Trash2, DollarSign, Download, Edit2, X, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ModalConfirmacao from '../../components/ModalConfirmacao';
import { gerarRelatorioPDF } from '../../utils/gerarRelatorioPDF';

export default function FinanceiroVinculo() {
  const { id } = useParams();
  const [vinculo, setVinculo] = useState<any>(null);
  const [relatorios, setRelatorios] = useState<any[]>([]);
  const [ucsVinculadas, setUcsVinculadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<number | null>(null);

  const formInicial = {
    tipo_relatorio: 'consumo' as 'consumo' | 'injetado' | 'usina_consumo',
    mes_referencia: '', unidade_consumidora_id: '', unidade_geradora: '',
    energia_consumida: '', energia_compensada: '', valor_tarifa: '', outras_taxas: '', iluminacao_publica: '', injecao_propria: '', desconto_bandeira_injecao: '', valor_pago_fatura: '', economia_fatura: '', desconto_economia: '', valor_economizado_solar: '', total_receber: '', energia_acumulada: '',
    leitura_anterior: '', leitura_atual: '', qtd_injetada: '', qtd_compensada_geradora: '', saldo_transferido: '', valor_kwh_bruto: '', valor_kwh_fio_b: '', valor_kwh_liquido: '', valor_pagar: '', valor_fatura_geradora: '', valor_liquido_pagar: '', total_bruto: '', dif_tusd_fio_b: '',
    arquivo: null as File | null, recibo: null as File | null, arquivo_url_existente: null as string | null, recibo_url_existente: null as string | null
  };

  const [formData, setFormData] = useState(formInicial);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const dadosVinculo = await api.vinculos.get(Number(id));
      setVinculo(dadosVinculo);
      if (dadosVinculo.unidades_vinculadas) setUcsVinculadas(dadosVinculo.unidades_vinculadas);
      try {
        const dados = await api.relatoriosFinanceiros.list(Number(id));
        setRelatorios(Array.isArray(dados) ? dados : []);
      } catch (e) { setRelatorios([]); }
    } catch (error) { toast.error('Erro ao carregar dados.'); } finally { setLoading(false); }
  };

  useEffect(() => { if (id) carregarDados(); }, [id]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadArquivo = async (file: File, bucketName: string) => {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); 
      const nomeArquivo = `${Date.now()}_${cleanName}`;
      const { error: uploadError } = await supabase.storage.from(bucketName).upload(nomeArquivo, file);
      if (uploadError) throw uploadError;
      return nomeArquivo;
    } catch (err: any) {
      console.error("Falha ao subir arquivo:", err.message);
      throw err;
    }
  };

  const handleDownloadSeguro = async (caminho: string) => {
    try {
      if (caminho.startsWith('http')) {
        window.open(caminho, '_blank');
        return;
      }
      const { data, error } = await supabase.storage.from('documentos').createSignedUrl(caminho, 60);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast.error('Erro ao acessar o arquivo.');
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mes_referencia) return toast.error('Mês obrigatório!');
    setUploading(true);
    const toastId = toast.loading('Salvando relatório...');

    try {
      let finalPlanilha = formData.arquivo_url_existente || null;
      let finalRecibo = formData.recibo_url_existente || null;
      
      if (formData.arquivo) finalPlanilha = await uploadArquivo(formData.arquivo, 'documentos');
      if (formData.recibo) finalRecibo = await uploadArquivo(formData.recibo, 'documentos');

      const payload = {
        vinculo_id: Number(id),
        ...formData,
        unidade_consumidora_id: formData.tipo_relatorio === 'consumo' ? (formData.unidade_consumidora_id || null) : null,
        unidade_geradora: formData.tipo_relatorio !== 'consumo' ? (formData.unidade_geradora || null) : null,
        arquivo_url: finalPlanilha,
        recibo_url: finalRecibo
      };

      if (editingId) await api.relatoriosFinanceiros.update(editingId, payload);
      else await api.relatoriosFinanceiros.create(payload);

      toast.success('Relatório salvo!', { id: toastId });
      setShowForm(false); setEditingId(null); carregarDados();
    } catch (error) {
      toast.error('Erro ao salvar dados.', { id: toastId });
    } finally { setUploading(false); }
  };

  const handleEditar = (item: any) => {
    setEditingId(item.id);
    setFormData({ 
      ...formInicial, ...item, 
      unidade_consumidora_id: item.unidade_consumidora_id ? String(item.unidade_consumidora_id) : '',
      unidade_geradora: item.unidade_geradora || '',
      arquivo_url_existente: item.arquivo_url, 
      recibo_url_existente: item.recibo_url 
    });
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmarExclusao = async () => {
    if (!idParaExcluir) return;
    try {
      await api.relatoriosFinanceiros.delete(idParaExcluir);
      toast.success('Excluído com sucesso.'); carregarDados();
    } catch (e) { toast.error('Erro ao excluir.'); } finally { setModalExclusaoAberto(false); setIdParaExcluir(null); }
  };

  const camposConsumo = [
    { name: 'energia_consumida', label: 'Energia Consumida', suffix: 'kWh' }, { name: 'energia_compensada', label: 'Energia Compensada', suffix: 'kWh' }, { name: 'injecao_propria', label: 'Injeção Própria', suffix: 'kWh' }, { name: 'energia_acumulada', label: 'Energia Acumulada', suffix: 'kWh' }, { name: 'valor_tarifa', label: 'Valor Tarifa', prefix: 'R$' }, { name: 'iluminacao_publica', label: 'Iluminação Pública', prefix: 'R$' }, { name: 'outras_taxas', label: 'Outras Taxas', prefix: 'R$' }, { name: 'desconto_bandeira_injecao', label: 'Desc. Bandeira / Inj. Própria', prefix: 'R$' }, { name: 'valor_pago_fatura', label: 'Valor Pago na Fatura', prefix: 'R$' }, { name: 'economia_fatura', label: 'Economia na Fatura', prefix: 'R$' }, { name: 'desconto_economia', label: 'Desconto s/ Economia', prefix: 'R$' }, { name: 'valor_economizado_solar', label: 'Valor Economizado Solar', prefix: 'R$' }, { name: 'total_receber', label: 'Total a Receber', prefix: 'R$', highlight: true },
  ];

  const camposInjetado = [
    { name: 'leitura_anterior', label: 'Leitura Anterior', suffix: 'kWh' }, { name: 'leitura_atual', label: 'Leitura Atual', suffix: 'kWh' }, { name: 'qtd_injetada', label: 'Qtd Injetada', suffix: 'kWh' }, { name: 'qtd_compensada_geradora', label: 'Compensada Geradora', suffix: 'kWh' }, { name: 'saldo_transferido', label: 'Saldo Transferido', suffix: 'kWh' }, { name: 'valor_kwh_bruto', label: 'Valor kWh Bruto', prefix: 'R$' }, { name: 'valor_kwh_fio_b', label: 'Valor kWh Fio B', prefix: 'R$' }, { name: 'valor_kwh_liquido', label: 'Valor kWh Líquido', prefix: 'R$' }, { name: 'valor_pagar', label: 'Valor a Pagar', prefix: 'R$' }, { name: 'valor_fatura_geradora', label: 'Valor Fatura Geradora', prefix: 'R$' }, { name: 'valor_liquido_pagar', label: 'Valor Líquido a Pagar', prefix: 'R$', highlight: true },
  ];

  const camposUsinaConsumo = [
    { name: 'energia_consumida', label: 'Energia Consumida da Rede', suffix: 'kWh' }, { name: 'energia_compensada', label: 'Energia Compensada', suffix: 'kWh' }, { name: 'valor_tarifa', label: 'Valor kW', prefix: 'R$' }, { name: 'total_bruto', label: 'Total Bruto', prefix: 'R$' }, { name: 'valor_kwh_fio_b', label: 'Fio B', prefix: 'R$' }, { name: 'dif_tusd_fio_b', label: 'DIF TUSD Sem Imposto (Fio B)', prefix: 'R$' }, { name: 'valor_fatura_geradora', label: 'Valor Fatura UC Geradora', prefix: 'R$' }, { name: 'valor_liquido_pagar', label: 'Total Líquido a Pagar', prefix: 'R$', highlight: true },
  ];

  const renderField = (campo: any, color: string) => (
    <div key={campo.name} className={`${campo.highlight ? `col-span-full md:col-span-3 bg-${color}-100 p-4 rounded-xl border border-${color}-300` : ''}`}>
      <label className="block text-[11px] font-bold uppercase mb-1 text-gray-600">{campo.label}</label>
      <div className="relative flex items-center">
        {campo.prefix && <span className="absolute left-3 text-sm font-bold text-gray-400">{campo.prefix}</span>}
        <input type="number" step="any" name={campo.name} className={`w-full py-2.5 pl-${campo.prefix ? '9' : '3'} pr-${campo.suffix ? '12' : '3'} border border-gray-200 rounded-lg outline-none font-semibold focus:ring-2 focus:ring-${color}-500`} value={(formData as any)[campo.name] || ''} onChange={handleChange} />
        {campo.suffix && <span className="absolute right-3 text-[11px] font-bold text-gray-400 uppercase">{campo.suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/vinculos/${id}`} className="p-3 bg-white hover:bg-gray-50 rounded-full border border-gray-200 shadow-sm"><ArrowLeft size={24}/></Link>
          <div>
            <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
            <div className="text-sm text-gray-500">#{vinculo?.vinculo_id} • {vinculo?.consumidores?.nome}</div>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData(formInicial); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all">
            <DollarSign size={20} /> Novo Relatório
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-6 md:p-8 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Settings2 className="text-blue-600" /> {editingId ? 'Editar Relatório' : 'Preenchimento Manual'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
          </div>

          <form onSubmit={handleSalvar} className="space-y-6">
            {!editingId && (
              <div className="flex flex-wrap gap-4 p-2 bg-gray-50 rounded-lg w-max mb-6">
                {['consumo', 'injetado', 'usina_consumo'].map(tipo => (
                  <label key={tipo} className={`px-4 py-2 rounded-md cursor-pointer font-bold transition-all ${formData.tipo_relatorio === tipo ? 'bg-white shadow text-blue-600 border border-gray-200' : 'text-gray-500'}`}>
                    <input type="radio" name="tipo_relatorio" value={tipo} checked={formData.tipo_relatorio === tipo} onChange={handleChange} className="hidden"/>
                    {tipo.replace('_', ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mês de Referência</label>
                <input required type="month" name="mes_referencia" className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold" value={formData.mes_referencia} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{formData.tipo_relatorio === 'consumo' ? 'Unidade Consumidora (UC)' : 'Unidade Geradora'}</label>
                {formData.tipo_relatorio === 'consumo' ? (
                  <select name="unidade_consumidora_id" className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-semibold" value={formData.unidade_consumidora_id} onChange={handleChange}>
                    <option value="">Selecione UC...</option>
                    {ucsVinculadas.map(u => <option key={u.id} value={u.unidade_consumidora_id}>UC {u.unidades_consumidoras.codigo_uc}</option>)}
                  </select>
                ) : (
                  <input type="text" name="unidade_geradora" placeholder="Número da Geradora" className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 font-semibold" value={formData.unidade_geradora} onChange={handleChange} />
                )}
              </div>
            </div>

            {formData.tipo_relatorio === 'consumo' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{camposConsumo.map(c => renderField(c, 'blue'))}</div>}
            {formData.tipo_relatorio === 'injetado' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{camposInjetado.map(c => renderField(c, 'orange'))}</div>}
            {formData.tipo_relatorio === 'usina_consumo' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{camposUsinaConsumo.map(c => renderField(c, 'green'))}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <label className="cursor-pointer block text-sm font-bold text-gray-500">
                  <div className="flex items-center gap-2 mb-1"><FileText size={16}/> Planilha/Memória</div>
                  <input type="file" className="text-xs w-full" onChange={e => setFormData({ ...formData, arquivo: e.target.files?.[0] || null })} />
                  {formData.arquivo_url_existente && <div className="text-[10px] text-blue-500 mt-1">Já existe um arquivo salvo.</div>}
                </label>
              </div>
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <label className="cursor-pointer block text-sm font-bold text-gray-500">
                  <div className="flex items-center gap-2 mb-1"><Upload size={16}/> Fatura/Recibo</div>
                  <input type="file" className="text-xs w-full" onChange={e => setFormData({ ...formData, recibo: e.target.files?.[0] || null })} />
                  {formData.recibo_url_existente && <div className="text-[10px] text-green-600 mt-1">Já existe um recibo salvo.</div>}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all">Cancelar</button>
              <button type="submit" disabled={uploading} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-md transition-all">
                {uploading ? 'A guardar...' : 'Salvar e Gerar Relatório'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Mês Referência</th>
              <th className="px-6 py-4 text-center">Tipo</th>
              <th className="px-6 py-4 text-center">Anexos</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {relatorios.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-all">
                <td className="px-6 py-4 font-bold capitalize">{new Date(r.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${r.tipo_relatorio === 'injetado' ? 'bg-orange-100 text-orange-700' : r.tipo_relatorio === 'usina_consumo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {r.tipo_relatorio.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-center flex justify-center gap-3">
                  {r.arquivo_url && <button onClick={() => handleDownloadSeguro(r.arquivo_url)} className="text-blue-500 hover:scale-110 transition-transform"><FileText /></button>}
                  {r.recibo_url && <button onClick={() => handleDownloadSeguro(r.recibo_url)} className="text-green-500 hover:scale-110 transition-transform"><Download /></button>}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => gerarRelatorioPDF(r, vinculo)} className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs ${r.tipo_relatorio === 'injetado' ? 'bg-orange-500' : r.tipo_relatorio === 'usina_consumo' ? 'bg-green-600' : 'bg-blue-600'}`}>PDF</button>
                    <button onClick={() => handleEditar(r)} className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"><Edit2 size={16}/></button>
                    <button onClick={() => { setIdParaExcluir(r.id); setModalExclusaoAberto(true); }} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {relatorios.length === 0 && <div className="p-12 text-center text-gray-500">Nenhum relatório para este contrato.</div>}
      </div>

      <ModalConfirmacao isOpen={modalExclusaoAberto} onClose={() => setModalExclusaoAberto(false)} onConfirm={confirmarExclusao} title="Excluir Relatório?" message="Esta ação não pode ser desfeita." confirmText="Excluir" isDestructive={true} />
    </div>
  );
}
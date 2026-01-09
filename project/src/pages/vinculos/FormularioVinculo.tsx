import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function FormularioVinculo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    ConsumidorID: '',
    UsinaID: '',
    StatusID: '',
    Observacao: ''
  });

  const [listas, setListas] = useState<{consumidores:any[], usinas:any[], status:any[]}>({
    consumidores: [], usinas: [], status: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [c, u, s] = await Promise.all([
          api.consumidores.list().catch(()=>[]),
          api.usinas.list().catch(()=>[]),
          api.status.list().catch(()=>[])
        ]);
        setListas({ consumidores:c||[], usinas:u||[], status:s||[] });

        if (isEditing) {
          const v = await api.vinculos.get(Number(id));
          setFormData({
            ConsumidorID: v.ConsumidorID || v.consumidorid || '',
            UsinaID: v.UsinaID || v.usinaid || '',
            StatusID: v.StatusID || v.statusid || '',
            Observacao: v.Observacao || v.observacao || ''
          });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    init();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ConsumidorID: Number(formData.ConsumidorID),
        UsinaID: Number(formData.UsinaID),
        StatusID: Number(formData.StatusID),
        Observacao: formData.Observacao
      };
      if (isEditing) await api.vinculos.update(Number(id), payload);
      else await api.vinculos.create(payload);
      navigate('/vinculos');
    } catch (e) { alert('Erro ao salvar'); }
  };

  if(loading) return <div className="p-8">Carregando...</div>;

  return (
    <div>
      <div className="mb-8 flex items-center gap-4"><Link to="/vinculos"><ArrowLeft className="w-6 h-6 text-gray-600"/></Link><h2 className="text-3xl font-bold">{isEditing?'Editar':'Novo'} Vínculo</h2></div>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border space-y-6 max-w-3xl">
        <div><label className="block text-sm font-medium mb-2">Consumidor</label>
          <select required className="w-full border rounded p-2" value={formData.ConsumidorID} onChange={e=>setFormData({...formData,ConsumidorID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.consumidores.map((c:any)=><option key={c.ConsumidorID||c.consumidorid} value={c.ConsumidorID||c.consumidorid}>{c.Nome||c.nome}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-2">Usina</label>
          <select required className="w-full border rounded p-2" value={formData.UsinaID} onChange={e=>setFormData({...formData,UsinaID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.usinas.map((u:any)=><option key={u.UsinaID||u.usinaid} value={u.UsinaID||u.usinaid}>{u.NomeProprietario||u.nomeproprietario}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-2">Status</label>
          <select required className="w-full border rounded p-2" value={formData.StatusID} onChange={e=>setFormData({...formData,StatusID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.status.map((s:any)=><option key={s.StatusID||s.statusid} value={s.StatusID||s.statusid}>{s.Descricao||s.descricao}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-2">Observações</label><textarea rows={4} className="w-full border rounded p-2" value={formData.Observacao} onChange={e=>setFormData({...formData,Observacao:e.target.value})}/></div>
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded font-medium flex items-center gap-2"><Save className="w-5 h-5"/> Salvar</button>
      </form>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Save, X } from 'lucide-react';

// DEFINIÇÃO DAS PROPS QUE O FORMULÁRIO ACEITA
interface FormularioVinculoProps {
  vinculoParaEditar?: any;
  onSalvar?: () => void;
  onCancelar?: () => void;
}

export default function FormularioVinculo({ vinculoParaEditar, onSalvar, onCancelar }: FormularioVinculoProps = {}) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Decide se está editando baseado na URL (id) OU se recebeu dados do pai (vinculoParaEditar)
  const isEditing = !!id || !!vinculoParaEditar;
  
  // Pega o ID correto (da URL ou do objeto passado)
  const editingId = id ? Number(id) : (vinculoParaEditar?.id || vinculoParaEditar?.VinculoID);

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

        // SE RECEBEU DADOS DO PAI (Edição na mesma tela)
        if (vinculoParaEditar) {
          setFormData({
            ConsumidorID: vinculoParaEditar.consumidor_id || vinculoParaEditar.ConsumidorID || '',
            UsinaID: vinculoParaEditar.usina_id || vinculoParaEditar.UsinaID || '',
            StatusID: vinculoParaEditar.status_id || vinculoParaEditar.StatusID || '',
            Observacao: vinculoParaEditar.observacao || vinculoParaEditar.Observacao || ''
          });
        } 
        // SE TEM ID NA URL (Edição por rota direta)
        else if (id) {
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
  }, [id, vinculoParaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ConsumidorID: Number(formData.ConsumidorID),
        UsinaID: Number(formData.UsinaID),
        StatusID: Number(formData.StatusID),
        Observacao: formData.Observacao
      };

      if (isEditing && editingId) {
        await api.vinculos.update(editingId, payload);
      } else {
        await api.vinculos.create(payload);
      }

      // Se foi chamado pelo componente pai, avisa que salvou
      if (onSalvar) {
        onSalvar();
      } else {
        // Se foi por rota, navega de volta
        navigate('/vinculos');
      }
    } catch (e) { alert('Erro ao salvar'); }
  };

  if(loading) return <div className="p-8">Carregando...</div>;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Só mostra seta de voltar se NÃO estiver no modo modal/interno */}
          {!onCancelar && (
            <Link to="/vinculos"><ArrowLeft className="w-6 h-6 text-gray-600"/></Link>
          )}
          <h2 className="text-3xl font-bold">{isEditing ? 'Editar' : 'Novo'} Vínculo</h2>
        </div>
        
        {/* Botão de Fechar caso esteja no modo interno */}
        {onCancelar && (
          <button onClick={onCancelar} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500"/>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow border space-y-6 max-w-3xl">
        <div>
          <label className="block text-sm font-medium mb-2">Consumidor</label>
          <select required className="w-full border rounded p-2" value={formData.ConsumidorID} onChange={e=>setFormData({...formData,ConsumidorID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.consumidores.map((c:any)=><option key={c.ConsumidorID||c.id} value={c.ConsumidorID||c.id}>{c.Nome||c.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Usina</label>
          <select required className="w-full border rounded p-2" value={formData.UsinaID} onChange={e=>setFormData({...formData,UsinaID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.usinas.map((u:any)=><option key={u.UsinaID||u.id} value={u.UsinaID||u.id}>{u.NomeProprietario||u.nomeproprietario||u.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select required className="w-full border rounded p-2" value={formData.StatusID} onChange={e=>setFormData({...formData,StatusID:e.target.value})}>
            <option value="">Selecione...</option>
            {listas.status.map((s:any)=><option key={s.StatusID||s.id} value={s.StatusID||s.id}>{s.Descricao||s.descricao}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observações</label>
          <textarea rows={4} className="w-full border rounded p-2" value={formData.Observacao} onChange={e=>setFormData({...formData,Observacao:e.target.value})}/>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded font-medium flex items-center gap-2">
            <Save className="w-5 h-5"/> Salvar
          </button>
          
          {onCancelar && (
            <button type="button" onClick={onCancelar} className="px-8 py-3 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200">
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
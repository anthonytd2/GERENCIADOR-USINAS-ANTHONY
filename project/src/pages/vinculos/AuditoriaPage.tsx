import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, FileText } from 'lucide-react';
import AuditoriaVinculoComponent from '../../components/AuditoriaVinculo';

export default function AuditoriaPage() {
  const { id } = useParams();
  const [vinculo, setVinculo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca o vínculo para saber o Percentual e o Nome do Cliente
    api.vinculos.get(Number(id))
      .then(setVinculo)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando dados do contrato...</div>;
  if (!vinculo) return <div className="p-12 text-center text-red-500">Vínculo não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-in-down">
      
      {/* Cabeçalho de Navegação */}
      <div className="mb-8">
        <Link to={`/vinculos/${id}`} className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors ">
          <ArrowLeft className="w-5 h-5" /> Voltar ao Detalhe do Contrato
        </Link>

        <div className="bg-gray-50-card p-6 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" />
              Auditoria de Créditos
            </h1>
            <p className="text-gray-500 mt-1">
              Cliente: <strong className="text-gray-900">{vinculo.consumidores?.nome}</strong> | 
              Alocação: <strong className="text-blue-600">{vinculo.percentual}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* O Componente que já criamos entra aqui */}
      <AuditoriaVinculoComponent 
        vinculoId={Number(id)} 
        percentualVinculo={Number(vinculo.percentual)} 
      />

    </div>
  );
}
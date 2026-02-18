import { useState, useEffect } from 'react';
import { supabaseClient as supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { FileText, Trash2, Upload, Download, AlertCircle, Loader2, File } from 'lucide-react';

interface GerenciadorDocumentosProps {
  tipoEntidade: 'consumidor' | 'usina' | 'vinculo'; 
  entidadeId: number;
}

export default function GerenciadorDocumentos({ tipoEntidade, entidadeId }: GerenciadorDocumentosProps) {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState('');

  // Carrega a lista ao abrir
  useEffect(() => {
    carregarDocumentos();
  }, [entidadeId, tipoEntidade]);

  const carregarDocumentos = async () => {
    try {
      // Chama a API que consulta a tabela 'documentos'
      const lista = await api.documentos.list(tipoEntidade, entidadeId);
      setDocumentos(lista || []);
    } catch (error) {
      console.error('Erro ao carregar documentos', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setUploading(true);
    setErro('');

    try {
      // 1. Nome único para não sobreescrever
      const nomeArquivoLimpo = arquivo.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const caminhoStorage = `${tipoEntidade}s/${entidadeId}/${Date.now()}_${nomeArquivoLimpo}`;

      // 2. Upload para o Supabase Storage (Bucket CORRETO: 'documentos')
      const { error: storageError } = await supabase.storage
        .from('documentos') // <--- CORREÇÃO AQUI
        .upload(caminhoStorage, arquivo);

      if (storageError) throw storageError;

      // 3. Salva os metadados no Backend
      await api.documentos.create({
        nome_arquivo: arquivo.name,
        caminho_storage: caminhoStorage,
        tipo_entidade: tipoEntidade,
        entidade_id: Number(entidadeId),
        tamanho_bytes: arquivo.size
      });

      // 4. Sucesso!
      await carregarDocumentos(); // Atualiza a lista
      event.target.value = ''; // Limpa o input
    } catch (err: any) {
      console.error(err);
      setErro('Erro ao enviar arquivo. Verifique se o arquivo não é muito grande.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      // Bucket CORRETO: 'documentos'
      const { data } = supabase.storage
        .from('documentos') // <--- CORREÇÃO AQUI
        .getPublicUrl(doc.caminho_storage);
      
      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        alert('Erro ao gerar link de download');
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    try {
      await api.documentos.delete(id);
      setDocumentos(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      alert('Erro ao excluir documento');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-50-card rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
      {/* CABEÇALHO DO COFRE */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> 
            Cofre de Documentos
          </h3>
          <p className="text-sm text-gray-500">
            Contratos, faturas e arquivos importantes
          </p>
        </div>
        
        {/* BOTÃO DE UPLOAD */}
        <div>
          <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="">{uploading ? 'Enviando...' : 'Adicionar Arquivo'}</span>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleUpload} 
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" 
            />
          </label>
        </div>
      </div>

      {/* ÁREA DE MENSAGENS DE ERRO */}
      {erro && (
        <div className="p-4 bg-red-50 text-red-700 text-sm flex items-center gap-2 border-b border-red-100">
          <AlertCircle className="w-4 h-4" /> {erro}
        </div>
      )}

      {/* LISTA DE ARQUIVOS */}
      <div className="p-0">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Carregando documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 m-4 rounded-xl">
            <Upload className="w-10 h-10 mb-2 opacity-20" />
            <p>Nenhum documento arquivado ainda.</p>
            <p className="text-xs mt-1">Envie contratos ou comprovantes para manter organizado.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 ">Nome do Arquivo</th>
                <th className="px-6 py-3 ">Data Envio</th>
                <th className="px-6 py-3 ">Tamanho</th>
                <th className="px-6 py-3 text-right ">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <File className="w-4 h-4" />
                    </div>
                    <span className=" text-gray-700 group-hover:text-blue-700">
                      {doc.nome_arquivo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()} <span className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleTimeString().slice(0,5)}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {formatBytes(doc.tamanho_bytes)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50-card rounded-lg transition-all"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleExcluir(doc.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50-card rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
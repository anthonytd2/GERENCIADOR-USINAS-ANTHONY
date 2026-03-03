import express from 'express';
import { supabase } from '../db.js';
import xss from 'xss'; // 🟢 NOVO: Importando a biblioteca de sanitização

const router = express.Router();

// 🟢 NOVO: Função de Segurança (Varredor de XSS)
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) return data;
  const sanitized = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = xss(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// 1. LISTAR DOCUMENTOS DE UM CLIENTE
router.get('/:tipo/:id', async (req, res) => {
  try {
    // CORREÇÃO: Nome da tabela alterado para 'documentos'
    const { data, error } = await supabase
      .from('documentos') 
      .select('*')
      .eq('tipo_entidade', req.params.tipo) // 'consumidor' ou 'usina'
      .eq('entidade_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao listar:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. REGISTRAR NOVO ARQUIVO (Metadados)
router.post('/', async (req, res) => {
  try {
    // 🟢 SEGURANÇA APLICADA: Limpamos o req.body antes de extrair as variáveis
    const dadosLimpos = sanitizeInput(req.body);
    const { nome_arquivo, caminho_storage, tipo_entidade, entidade_id, tamanho_bytes } = dadosLimpos;
    
    // CORREÇÃO: Nome da tabela alterado para 'documentos'
    const { data, error } = await supabase
      .from('documentos')
      .insert([{ nome_arquivo, caminho_storage, tipo_entidade, entidade_id, tamanho_bytes }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao salvar metadados:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 3. EXCLUIR ARQUIVO
router.delete('/:id', async (req, res) => {
  try {
    // CORREÇÃO: Busca na tabela 'documentos'
    const { data: doc } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', req.params.id)
        .single();
    
    if (doc) {
      // 1. Remove do Bucket "documentos" (Storage físico)
      // CORREÇÃO: Nome do bucket alterado para 'documentos'
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .remove([doc.caminho_storage]);
      
      if (storageError) console.error('Erro no storage:', storageError);

      // 2. Remove da Tabela (Metadados)
      // CORREÇÃO: Nome da tabela alterado para 'documentos'
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', req.params.id);

      if (error) throw error;
    }

    res.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
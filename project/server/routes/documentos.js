import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR DOCUMENTOS DE UM CLIENTE
router.get('/:tipo/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('tipo_entidade', req.params.tipo) // 'consumidor' ou 'usina'
      .eq('entidade_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. REGISTRAR NOVO ARQUIVO (Metadados)
router.post('/', async (req, res) => {
  try {
    const { nome_arquivo, caminho_storage, tipo_entidade, entidade_id, tamanho_bytes } = req.body;
    
    const { data, error } = await supabase
      .from('documentos')
      .insert([{ nome_arquivo, caminho_storage, tipo_entidade, entidade_id, tamanho_bytes }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. EXCLUIR ARQUIVO
router.delete('/:id', async (req, res) => {
  try {
    // Primeiro buscamos o arquivo para saber o caminho no Storage
    const { data: doc } = await supabase.from('documentos').select('*').eq('id', req.params.id).single();
    
    if (doc) {
      // 1. Remove do Bucket "documentos" (Storage físico)
      await supabase.storage.from('documentos').remove([doc.caminho_storage]);
      
      // 2. Remove da Tabela (Metadados)
      const { error } = await supabase.from('documentos').delete().eq('id', req.params.id);
      if (error) throw error;
    }

    res.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
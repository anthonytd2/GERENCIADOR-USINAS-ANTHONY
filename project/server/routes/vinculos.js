import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// --- LISTAR TODOS OS VÍNCULOS ---
router.get('/', async (req, res) => {
  try {
    // Busca dados usando os nomes corretos das tabelas e colunas
    // Tenta buscar a descrição do status, nome do consumidor e da usina via JOIN
    const { data, error } = await supabase
      .from('vinculos')
      .select(`
        *,
        consumidores ( Nome ),
        usinas ( Nome, NomeProprietario ),
        status ( Descricao )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formata os dados para o Frontend (que espera tudo minúsculo e simplificado)
    const vinculosFormatados = data.map(v => {
      // Tenta pegar o nome da usina (pode ser Nome ou NomeProprietario dependendo da tabela)
      const nomeUsina = v.usinas?.NomeProprietario || v.usinas?.Nome || 'Usina não encontrada';
      
      // Tenta pegar o status da tabela JOIN ou adivinha pelo ID se o join falhar
      let nomeStatus = v.status?.Descricao;
      if (!nomeStatus) {
         if (v.StatusID === 1) nomeStatus = 'Ativo';
         else if (v.StatusID === 2) nomeStatus = 'Pendente';
         else nomeStatus = 'Verificar';
      }

      return {
        id: v.VinculoID, // Mapeia VinculoID para id
        consumidor_id: v.ConsumidorID,
        usina_id: v.UsinaID,
        status_id: v.StatusID,
        percentual: v.Percentual,
        data_inicio: v.DataInicio,
        
        // Campos extras para exibição
        consumidor_nome: v.consumidores?.Nome || 'Consumidor desconhecido',
        usina_nome: nomeUsina,
        status_nome: nomeStatus
      };
    });

    res.json(vinculosFormatados);
  } catch (error) {
    console.error('Erro detalhado ao buscar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar dados: ' + error.message });
  }
});

// --- CRIAR NOVO VÍNCULO ---
router.post('/', async (req, res) => {
  // Recebe os dados (o frontend manda em PascalCase como visto no Formulario)
  const { ConsumidorID, UsinaID, Percentual, StatusID, Observacao } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .insert([
        { 
          ConsumidorID, 
          UsinaID, 
          Percentual, 
          StatusID, 
          Observacao,
          DataInicio: new Date() // Define data de início automática
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- ATUALIZAR VÍNCULO ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { Percentual, StatusID, Observacao } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('vinculos')
      .update({ 
        Percentual, 
        StatusID, 
        Observacao,
        updated_at: new Date() 
      })
      .eq('VinculoID', id) // Usa VinculoID para encontrar o registro
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- EXCLUIR VÍNCULO ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { error } = await supabase
      .from('vinculos')
      .delete()
      .eq('VinculoID', id); // Usa VinculoID

    if (error) throw error;
    res.json({ message: 'Vínculo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
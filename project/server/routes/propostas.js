import express from 'express';
import { supabase } from '../db.js';

const router = express.Router();

// 1. LISTAR TODAS
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. BUSCAR UMA POR ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. CRIAR
router.post('/', async (req, res) => {
  try {
    const { consumidor_id, nome_cliente_prospect, concessionaria_id, dados_simulacao, status, cpf_cnpj, telefone, email } = req.body;

    const { data, error } = await supabase
      .from('propostas')
      .insert([{
        consumidor_id,
        nome_cliente_prospect,
        concessionaria_id,
        dados_simulacao,
        status,
        cpf_cnpj, 
        telefone, 
        email
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const body = req.body;
    
    const payload = {
      updated_at: new Date()
    };

    if (body.status) payload.status = body.status;
    if (body.dados_simulacao) payload.dados_simulacao = body.dados_simulacao;
    if (body.nome_cliente_prospect) payload.nome_cliente_prospect = body.nome_cliente_prospect;
    if (body.consumidor_id) payload.consumidor_id = body.consumidor_id;
    if (body.concessionaria_id) payload.concessionaria_id = body.concessionaria_id;
    
    if (body.cpf_cnpj) payload.cpf_cnpj = body.cpf_cnpj;
    if (body.telefone) payload.telefone = body.telefone;
    if (body.email) payload.email = body.email;

    const { data, error } = await supabase
      .from('propostas')
      .update(payload) 
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('propostas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Proposta excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// 6. CONVERTER EM VENDA (CORRIGIDO)
// =====================================================
router.post('/:id/converter', async (req, res) => {
  try {
    const idProposta = req.params.id;

    // A. Buscar dados da proposta
    const { data: proposta, error: errProp } = await supabase
      .from('propostas')
      .select('*')
      .eq('id', idProposta)
      .single();

    if (errProp) throw errProp;

    // B. Preparar dados do Consumidor
    // CORREÇÃO: Removemos 'email' e 'telefone' diretos pois a tabela não tem essas colunas.
    // Salvamos na observação para não perder.
    const obsContato = `Convertido de Proposta. Contato: ${proposta.telefone || '-'} | Email: ${proposta.email || '-'}`;

    const novoConsumidor = {
      nome: proposta.nome_cliente_prospect,
      documento: proposta.documento || proposta.cpf_cnpj || 'A DEFINIR',
      endereco: proposta.endereco || null,
      cidade: proposta.cidade || null,
      uf: proposta.uf || 'PR',
      // REMOVIDOS: telefone e email (pois colunas não existem no consumidor)
      observacao: obsContato, 
      media_consumo: proposta.consumo_media_kwh || 0,
      tipo_desconto: 'porcentagem',
      percentual_desconto: 10, 
      unidade_consumidora: 'A DEFINIR'
    };

    // C. Criar o Consumidor
    const { data: consumidor, error: errCons } = await supabase
      .from('consumidores')
      .insert([novoConsumidor])
      .select()
      .single();

    if (errCons) {
      console.error("Erro ao criar consumidor:", errCons);
      throw new Error(`Erro ao criar consumidor: ${errCons.message}`);
    }

    // D. Atualizar status da proposta
    await supabase
      .from('propostas')
      .update({ 
          status: 'FECHADO', 
          consumidor_id: consumidor.consumidor_id 
      })
      .eq('id', idProposta);

    res.json({ 
      message: 'Conversão realizada com sucesso!', 
      consumidor_id: consumidor.consumidor_id 
    });

  } catch (error) {
    console.error("Erro na conversão:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
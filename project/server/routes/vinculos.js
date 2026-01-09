import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Listar todos os vínculos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.*,
        c.nome as consumidor_nome,
        u.nome as usina_nome,
        s.nome as status_nome  -- CORREÇÃO: Mudado de s.descricao para s.nome
      FROM vinculos v
      LEFT JOIN consumidores c ON v.consumidor_id = c.id
      LEFT JOIN usinas u ON v.usina_id = u.id
      LEFT JOIN status s ON v.status_id = s.id
      ORDER BY v.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vínculos:', error);
    res.status(500).json({ error: 'Erro ao buscar vínculos' });
  }
});

// Criar novo vínculo
router.post('/', async (req, res) => {
  const { consumidor_id, usina_id, percentual, status_id, data_inicio } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO vinculos (consumidor_id, usina_id, percentual, status_id, data_inicio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [consumidor_id, usina_id, percentual, status_id, data_inicio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar vínculo:', error);
    res.status(500).json({ error: 'Erro ao criar vínculo' });
  }
});

// Atualizar vínculo
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { percentual, status_id, data_inicio, data_fim } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE vinculos 
       SET percentual = $1, status_id = $2, data_inicio = $3, data_fim = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [percentual, status_id, data_inicio, data_fim, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar vínculo:', error);
    res.status(500).json({ error: 'Erro ao atualizar vínculo' });
  }
});

// Excluir vínculo
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM vinculos WHERE id = $1', [id]);
    res.json({ message: 'Vínculo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir vínculo:', error);
    res.status(500).json({ error: 'Erro ao excluir vínculo' });
  }
});

export default router;
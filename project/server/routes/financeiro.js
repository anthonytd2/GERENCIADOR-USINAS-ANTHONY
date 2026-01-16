import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// 1. LISTAR (Busca por vinculo_id)
router.get('/:vinculoId', async (req, res) => {
  try {
    const { vinculoId } = req.params;
    const result = await pool.query(
      'SELECT * FROM financeiro_novo WHERE vinculo_id = $1 ORDER BY mes_referencia DESC',
      [vinculoId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Erro Financeiro:", error);
    res.status(500).json({ error: 'Erro ao buscar financeiro', detalhe: error.message });
  }
});

// 2. CRIAR
router.post('/', async (req, res) => {
  try {
    // Recebe os dados do Frontend
    const { 
      vinculo_id, mes_referencia, energia, tarifa, 
      recebido, pago, spread, fio_b, taxas, 
      arquivo_url, recibo_url 
    } = req.body;

    const query = `
      INSERT INTO financeiro_novo 
      (vinculo_id, mes_referencia, energia, tarifa, recebido, pago, spread, fio_b, taxas, arquivo_url, recibo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [vinculo_id, mes_referencia, energia, tarifa, recebido, pago, spread, fio_b, taxas, arquivo_url, recibo_url];
    
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erro ao Salvar:", error);
    res.status(500).json({ error: 'Erro ao salvar', detalhe: error.message });
  }
});

// 3. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      mes_referencia, energia, tarifa, 
      recebido, pago, spread, fio_b, taxas, 
      arquivo_url, recibo_url 
    } = req.body;

    const query = `
      UPDATE financeiro_novo 
      SET mes_referencia = $1, energia = $2, tarifa = $3, 
          recebido = $4, pago = $5, spread = $6, 
          fio_b = $7, taxas = $8, arquivo_url = $9, recibo_url = $10
      WHERE id = $11
      RETURNING *
    `;

    const values = [mes_referencia, energia, tarifa, recebido, pago, spread, fio_b, taxas, arquivo_url, recibo_url, id];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar', detalhe: error.message });
  }
});

// 4. EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM financeiro_novo WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

export default router;
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// 1. LISTAR (Com mensagem de erro detalhada)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Busca usando 'vinculoid' minúsculo
    const result = await pool.query(
      'SELECT * FROM fechamentos WHERE vinculoid = $1 ORDER BY mesreferencia DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("ERRO NO BACKEND:", error);
    // AQUI: Mandamos o motivo real do erro para o navegador
    res.status(500).json({ 
      error: 'Erro ao buscar fechamentos', 
      motivo_real: error.message 
    });
  }
});

// 2. CRIAR
router.post('/', async (req, res) => {
  try {
    const { MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL, VinculoID } = req.body;
    const query = `
      INSERT INTO fechamentos 
      (mesreferencia, energiacompensada, valorrecebido, valorpago, spread, arquivourl, recibourl, vinculoid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL, VinculoID];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar', motivo_real: error.message });
  }
});

// 3. ATUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL } = req.body;
    const query = `
      UPDATE fechamentos 
      SET mesreferencia = $1, energiacompensada = $2, valorrecebido = $3, valorpago = $4, spread = $5, arquivourl = $6, recibourl = $7
      WHERE fechamentoid = $8
      RETURNING *
    `;
    const values = [MesReferencia, EnergiaCompensada, ValorRecebido, ValorPago, Spread, ArquivoURL, ReciboURL, req.params.id];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar', motivo_real: error.message });
  }
});

// 4. EXCLUIR
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM fechamentos WHERE fechamentoid = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir', motivo_real: error.message });
  }
});

export default router;
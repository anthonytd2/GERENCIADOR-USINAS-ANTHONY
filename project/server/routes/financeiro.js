import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

router.get('/:vinculoId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financeiro_novo WHERE vinculo_id = $1 ORDER BY mes_referencia DESC',
      [req.params.vinculoId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const query = `
      INSERT INTO financeiro_novo (
        vinculo_id, mes_referencia, 
        energia_compensada, valor_kw_base, taxa_fio_b, fatura_uc_geradora,
        tarifa_com_imposto, valor_pago_fatura, taxas_ilum_publica,
        total_bruto_gerador, total_liquido_gerador, total_simulado_copel,
        economia_real, total_receber_cliente, spread_lucro,
        arquivo_url, recibo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    const values = [
      body.vinculo_id, body.mes_referencia,
      body.energia_compensada, body.valor_kw_base, body.taxa_fio_b, body.fatura_uc_geradora,
      body.tarifa_com_imposto, body.valor_pago_fatura, body.taxas_ilum_publica,
      body.total_bruto_gerador, body.total_liquido_gerador, body.total_simulado_copel,
      body.economia_real, body.total_receber_cliente, body.spread_lucro,
      body.arquivo_url, body.recibo_url
    ];
    
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao salvar', detalhe: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM financeiro_novo WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir' });
  }
});

// A rota de UPDATE (PUT) pode ser atualizada depois se precisar editar, 
// por enquanto foque em CRIAR (POST) e LISTAR (GET) para testar.

export default router;
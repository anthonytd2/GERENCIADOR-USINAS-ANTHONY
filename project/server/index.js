import express from 'express';
import cors from 'cors';
import consumidoresRouter from './routes/consumidores.js';
import usinasRouter from './routes/usinas.js';
import statusRouter from './routes/status.js';
import vinculosRouter from './routes/vinculos.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/consumidores', consumidoresRouter);
app.use('/api/usinas', usinasRouter);
app.use('/api/status', statusRouter);
app.use('/api/vinculos', vinculosRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

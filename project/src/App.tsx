import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Consumidores
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import DetalheConsumidor from './pages/consumidores/DetalheConsumidor';

// Usinas
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';

// Vínculos
import ListaVinculos from './pages/vinculos/ListaVinculos';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';
import FinanceiroVinculo from './pages/vinculos/FinanceiroVinculo';

// Recibos
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';

// Financeiro
import FechamentoMensal from './pages/financeiro/FechamentoMensal';

// --- MÓDULO COMERCIAL (NOVOS IMPORTS) ---
import ListaPropostas from './pages/propostas/ListaPropostas';
import NovoSimulador from './pages/propostas/NovoSimulador'; 

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          
          {/* Rotas de Consumidores */}
          <Route path="/consumidores" element={<ListaConsumidores />} />
          <Route path="/consumidores/novo" element={<FormularioConsumidor />} />
          <Route path="/consumidores/:id/editar" element={<FormularioConsumidor />} />
          <Route path="/consumidores/:id" element={<DetalheConsumidor />} />

          {/* Rotas de Usinas */}
          <Route path="/usinas" element={<ListaUsinas />} />
          <Route path="/usinas/novo" element={<FormularioUsina />} />
          <Route path="/usinas/:id/editar" element={<FormularioUsina />} />
          <Route path="/usinas/:id" element={<DetalheUsina />} />

          {/* Rotas de Vínculos */}
          <Route path="/vinculos" element={<ListaVinculos />} />
          <Route path="/vinculos/:id" element={<DetalheVinculo />} />
          <Route path="/vinculos/:id/financeiro" element={<FinanceiroVinculo />} />

          {/* Rotas de Recibos */}
          <Route path="/recibos" element={<GerenciadorRecibos />} />

          {/* Rotas Financeiras */}
          <Route path="/financeiro/fechamento" element={<FechamentoMensal />} />

          {/* --- ROTAS DO CRM --- */}
{/* --- ROTAS DO CRM --- */}
          <Route path="/simulacoes" element={<ListaPropostas />} />
          <Route path="/simulacoes/novo" element={<NovoSimulador />} />
          {/* NOVA ROTA DE EDIÇÃO */}
          <Route path="/simulacoes/editar/:id" element={<NovoSimulador />} />
          
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
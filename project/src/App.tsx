import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Usinas
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';

// Consumidores
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import DetalheConsumidor from './pages/consumidores/DetalheConsumidor';

// Vínculos
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';
import FinanceiroVinculo from './pages/vinculos/FinanceiroVinculo';

// Outros
import FechamentoMensal from './pages/financeiro/FechamentoMensal';
import ListaPropostas from './pages/propostas/ListaPropostas';
import NovoSimulador from './pages/propostas/NovoSimulador';
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* --- ROTAS DE USINAS (ORDEM IMPORTA MUITO!) --- */}
          <Route path="/usinas" element={<ListaUsinas />} />
          
          {/* REGRA DE OURO: Rotas específicas (como 'novo') vêm ANTES das rotas dinâmicas (:id) */}
          <Route path="/usinas/novo" element={<FormularioUsina />} />
          <Route path="/usinas/:id/editar" element={<FormularioUsina />} />
          <Route path="/usinas/:id" element={<DetalheUsina />} />
          
          {/* --- ROTAS DE CONSUMIDORES --- */}
          <Route path="/consumidores" element={<ListaConsumidores />} />
          <Route path="/consumidores/novo" element={<FormularioConsumidor />} />
          <Route path="/consumidores/:id/editar" element={<FormularioConsumidor />} />
          <Route path="/consumidores/:id" element={<DetalheConsumidor />} />

          {/* --- ROTAS DE VÍNCULOS --- */}
          <Route path="/vinculos" element={<ListaVinculos />} />
          <Route path="/vinculos/novo" element={<FormularioVinculo />} />
          <Route path="/vinculos/:id" element={<DetalheVinculo />} />
          <Route path="/vinculos/:id/financeiro" element={<FinanceiroVinculo />} />

          {/* --- OUTRAS ROTAS --- */}
          <Route path="/financeiro" element={<FechamentoMensal />} />
          <Route path="/propostas" element={<ListaPropostas />} />
          <Route path="/simulador" element={<NovoSimulador />} />
          <Route path="/recibos" element={<GerenciadorRecibos />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
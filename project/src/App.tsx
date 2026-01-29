import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <--- IMPORTANTE
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
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';

// Propostas / Simulações
import ListaPropostas from './pages/propostas/ListaPropostas';
import NovoSimulador from './pages/propostas/NovoSimulador';

import RelatorioRentabilidade from './pages/relatorios/RelatorioRentabilidade';

function App() {
  return (
    <BrowserRouter>
    <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          
          {/* --- ROTAS DE USINAS --- */}
          <Route path="/usinas" element={<ListaUsinas />} />
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

          {/* --- ROTAS DE PROPOSTAS (CORRIGIDO) --- */}
          {/* Lista */}
          <Route path="/propostas" element={<ListaPropostas />} />
          
          {/* Nova Simulação */}
          <Route path="/propostas/novo" element={<NovoSimulador />} />
          
          {/* Editar/Ver Simulação (Usa o mesmo componente por enquanto) */}
          <Route path="/propostas/:id" element={<NovoSimulador />} />

          {/* --- OUTRAS --- */}
          <Route path="/financeiro" element={<FechamentoMensal />} />
          <Route path="/relatorios" element={<RelatorioRentabilidade />} />
          <Route path="/recibos" element={<GerenciadorRecibos />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
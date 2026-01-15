import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import DetalheConsumidor from './pages/consumidores/DetalheConsumidor';
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';
import NovoSimulador from './pages/propostas/NovoSimulador';
import FechamentoMensal from './pages/financeiro/FechamentoMensal'; // Importação do Financeiro

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          {/* Rotas de Consumidores */}
          <Route path="consumidores" element={<ListaConsumidores />} />
          <Route path="consumidores/novo" element={<FormularioConsumidor />} />
          <Route path="consumidores/:id" element={<DetalheConsumidor />} />
          <Route path="consumidores/:id/editar" element={<FormularioConsumidor />} />
          
          {/* Rotas de Usinas */}
          <Route path="usinas" element={<ListaUsinas />} />
          <Route path="usinas/novo" element={<FormularioUsina />} />
          <Route path="usinas/:id" element={<DetalheUsina />} />
          <Route path="usinas/:id/editar" element={<FormularioUsina />} />
          
          {/* Rotas de Vínculos */}
          <Route path="vinculos" element={<ListaVinculos />} />
          <Route path="vinculos/novo" element={<FormularioVinculo />} />
          <Route path="vinculos/:id" element={<DetalheVinculo />} />
          <Route path="vinculos/:id/editar" element={<FormularioVinculo />} />

          {/* Rota de Recibos */}
          <Route path="recibos" element={<GerenciadorRecibos />} />

          {/* Rota Comercial */}
          <Route path="simulador" element={<NovoSimulador />} />
          
          {/* Nova Rota Financeira */}
          <Route path="financeiro/fechamento" element={<FechamentoMensal />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';
import FinanceiroVinculo from './pages/vinculos/FinanceiroVinculo'; // <--- AQUI: Import da nova tela

import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';
import NovoSimulador from './pages/propostas/NovoSimulador';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="consumidores" element={<ListaConsumidores />} />
          <Route path="consumidores/novo" element={<FormularioConsumidor />} />
          <Route path="consumidores/:id" element={<DetalheConsumidor />} />
          <Route path="consumidores/:id/editar" element={<FormularioConsumidor />} />
          
          <Route path="usinas" element={<ListaUsinas />} />
          <Route path="usinas/novo" element={<FormularioUsina />} />
          <Route path="usinas/:id" element={<DetalheUsina />} />
          <Route path="usinas/:id/editar" element={<FormularioUsina />} />
          
          <Route path="vinculos" element={<ListaVinculos />} />
          <Route path="vinculos/novo" element={<FormularioVinculo />} />
          <Route path="vinculos/:id" element={<DetalheVinculo />} />
          
          {/* A ROTA CERTA É ESSA AQUI: */}
          <Route path="vinculos/:id/financeiro" element={<FinanceiroVinculo />} />

          <Route path="recibos" element={<GerenciadorRecibos />} />
          <Route path="simulador" element={<NovoSimulador />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
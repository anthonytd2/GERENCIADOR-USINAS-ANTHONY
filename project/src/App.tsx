import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

import Dashboard from './pages/Dashboard';
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';

// IMPORTAR O NOVO GERENCIADOR DE RECIBOS
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50">
        
        <Sidebar />

        <main className="flex-1 overflow-y-auto h-full">
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              
              <Route path="/consumidores" element={<ListaConsumidores />} />
              <Route path="/consumidores/novo" element={<FormularioConsumidor />} />
              <Route path="/consumidores/:id/editar" element={<FormularioConsumidor />} />
              
              <Route path="/usinas" element={<ListaUsinas />} />
              <Route path="/usinas/novo" element={<FormularioUsina />} />
              <Route path="/usinas/:id" element={<DetalheUsina />} />
              <Route path="/usinas/:id/editar" element={<FormularioUsina />} />
              
              <Route path="/vinculos" element={<ListaVinculos />} />
              <Route path="/vinculos/novo" element={<FormularioVinculo />} />
              <Route path="/vinculos/:id" element={<DetalheVinculo />} />
              <Route path="/vinculos/:id/editar" element={<FormularioVinculo />} />

              {/* NOVA ROTA DE RECIBOS */}
              <Route path="/recibos" element={<GerenciadorRecibos />} />
            </Routes>
          </div>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;
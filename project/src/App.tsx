import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importa o Menu Lateral (Sidebar)
import Sidebar from './components/Sidebar';


import Dashboard from '../src/pages/Dashboard';

// Importa as Telas de Consumidores
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';

// Importa as Telas de Usinas
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';

// Importa as Telas de Vínculos
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';

function App() {
  return (
    <BrowserRouter>
      {/* DIV PRINCIPAL: Usa 'flex' para colocar o Menu ao lado do Conteúdo */}
      <div className="flex min-h-screen bg-slate-50">
        
        {/* 1. MENU LATERAL (ESQUERDA) */}
        <Sidebar />

        {/* 2. CONTEÚDO DAS PÁGINAS (DIREITA) */}
        <div className="flex-1 overflow-auto h-screen">
          <div className="p-8">
            <Routes>
              {/* Rota da Dashboard */}
              <Route path="/" element={<Dashboard />} />
              
              {/* Rotas de Consumidores */}
              <Route path="/consumidores" element={<ListaConsumidores />} />
              <Route path="/consumidores/novo" element={<FormularioConsumidor />} />
              <Route path="/consumidores/:id/editar" element={<FormularioConsumidor />} />
              
              {/* Rotas de Usinas */}
              <Route path="/usinas" element={<ListaUsinas />} />
              <Route path="/usinas/novo" element={<FormularioUsina />} />
              <Route path="/usinas/:id" element={<DetalheUsina />} />
              <Route path="/usinas/:id/editar" element={<FormularioUsina />} />
              
              {/* Rotas de Vínculos */}
              <Route path="/vinculos" element={<ListaVinculos />} />
              <Route path="/vinculos/novo" element={<FormularioVinculo />} />
              <Route path="/vinculos/:id" element={<DetalheVinculo />} />
              <Route path="/vinculos/:id/editar" element={<FormularioVinculo />} />
            </Routes>
          </div>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
import React from 'react';
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
import FinanceiroVinculo from './pages/vinculos/FinanceiroVinculo'; // <--- NOVO IMPORT

import NovoSimulador from './pages/propostas/NovoSimulador';
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          {/* Usinas */}
          <Route path="usinas" element={<ListaUsinas />} />
          <Route path="usinas/nova" element={<FormularioUsina />} />
          <Route path="usinas/:id" element={<DetalheUsina />} />
          <Route path="usinas/:id/editar" element={<FormularioUsina />} />

          {/* Consumidores */}
          <Route path="consumidores" element={<ListaConsumidores />} />
          <Route path="consumidores/novo" element={<FormularioConsumidor />} />
          <Route path="consumidores/:id" element={<DetalheConsumidor />} />
          <Route path="consumidores/:id/editar" element={<FormularioConsumidor />} />

          {/* Vínculos */}
          <Route path="vinculos" element={<ListaVinculos />} />
          <Route path="vinculos/novo" element={<FormularioVinculo />} />
          <Route path="vinculos/:id" element={<DetalheVinculo />} />
          {/* NOVA ROTA DO FINANCEIRO */}
          <Route path="vinculos/:id/financeiro" element={<FinanceiroVinculo />} /> 

          {/* Outros */}
          <Route path="propostas/simulador" element={<NovoSimulador />} />
          <Route path="recibos" element={<GerenciadorRecibos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
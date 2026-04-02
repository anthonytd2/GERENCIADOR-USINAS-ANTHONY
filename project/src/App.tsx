import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuditoriaPage from './pages/vinculos/AuditoriaPage';
import ListaUsinas from './pages/usinas/ListaUsinas';
import FormularioUsina from './pages/usinas/FormularioUsina';
import DetalheUsina from './pages/usinas/DetalheUsina';
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import DetalheConsumidor from './pages/consumidores/DetalheConsumidor';
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo';
import FinanceiroVinculo from './pages/vinculos/FinanceiroVinculo';
import GerenciadorRecibos from './pages/recibos/GerenciadorRecibos';
import ListaPropostas from './pages/propostas/ListaPropostas';
import NovoSimulador from './pages/propostas/NovoSimulador';
import RelatorioRentabilidade from './pages/relatorios/RelatorioRentabilidade';
import EmitirMinuta from './pages/financeiro/EmitirMinuta';
import ListaProtocolos from './pages/protocolos/ListaProtocolos';
import { useAutoLogout } from './hooks/useAutoLogout';
import FluxoCaixa from './pages/financeiro/FluxoCaixa';
import MapaAlocacao from './pages/alocacao/MapaAlocacao';
import SimuladorViabilidade from './pages/simuladorviabilidade/SimuladorViabilidade';

function App() {
  useAutoLogout();
  return (
    <BrowserRouter>
      {/* Notificações globais do sistema */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <Routes>
        {/* 1. ROTA PÚBLICA: Acessível por qualquer pessoa */}
        <Route path="/login" element={<Login />} />

        {/* 2. ROTAS PROTEGIDAS: Só entra se o crachá (Token) for válido */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />

            {/* --- MÓDULO DE USINAS --- */}
            <Route path="/usinas" element={<ListaUsinas />} />
            <Route path="/usinas/novo" element={<FormularioUsina />} />
            <Route path="/usinas/:id/editar" element={<FormularioUsina />} />
            <Route path="/usinas/:id" element={<DetalheUsina />} />

            {/* --- MÓDULO DE CONSUMIDORES --- */}
            <Route path="/consumidores" element={<ListaConsumidores />} />
            <Route path="/consumidores/novo" element={<FormularioConsumidor />} />
            <Route path="/consumidores/:id/editar" element={<FormularioConsumidor />} />
            <Route path="/consumidores/:id" element={<DetalheConsumidor />} />

            {/* --- MÓDULO DE VÍNCULOS --- */}
            <Route path="/vinculos" element={<ListaVinculos />} />
            <Route path="/vinculos/novo" element={<FormularioVinculo />} />
            <Route path="/vinculos/:id/editar" element={<FormularioVinculo />} />
            <Route path="/vinculos/:id" element={<DetalheVinculo />} />
            <Route path="/vinculos/:id/financeiro" element={<FinanceiroVinculo />} />
            <Route path="/vinculos/:id/auditoria" element={<AuditoriaPage />} />

            {/* --- MÓDULO DE PROPOSTAS & SIMULADORES --- */}
            <Route path="/propostas" element={<ListaPropostas />} />
            <Route path="/propostas/novo" element={<NovoSimulador />} />
            <Route path="/propostas/:id" element={<NovoSimulador />} />
            <Route path="/simulador" element={<SimuladorViabilidade />} />
            {/* --- MÓDULO FINANCEIRO & RELATÓRIOS --- */}

            <Route path="/financeiro/minutas" element={<EmitirMinuta />} />
            <Route path="/relatorios" element={<RelatorioRentabilidade />} />
            <Route path="/recibos" element={<GerenciadorRecibos />} />
            <Route path="/protocolos" element={<ListaProtocolos />} />
            <Route path="/financeiro" element={<FluxoCaixa />} />
            <Route path="/alocacao" element={<MapaAlocacao />} />
            {/* Redirecionamento de segurança para rotas inexistentes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
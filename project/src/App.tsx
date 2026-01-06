import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ListaConsumidores from './pages/consumidores/ListaConsumidores';
import DetalheConsumidor from './pages/consumidores/DetalheConsumidor';
import FormularioConsumidor from './pages/consumidores/FormularioConsumidor';
import ListaUsinas from './pages/usinas/ListaUsinas';
import DetalheUsina from './pages/usinas/DetalheUsina';
import FormularioUsina from './pages/usinas/FormularioUsina';
import ListaVinculos from './pages/vinculos/ListaVinculos';
import FormularioVinculo from './pages/vinculos/FormularioVinculo';
import DetalheVinculo from './pages/vinculos/DetalheVinculo'; // <--- Importação Nova

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/consumidores" replace />} />

          <Route path="consumidores">
            <Route index element={<ListaConsumidores />} />
            <Route path="novo" element={<FormularioConsumidor />} />
            <Route path=":id" element={<DetalheConsumidor />} />
            <Route path=":id/editar" element={<FormularioConsumidor />} />
          </Route>

          <Route path="usinas">
            <Route index element={<ListaUsinas />} />
            <Route path="novo" element={<FormularioUsina />} />
            <Route path=":id" element={<DetalheUsina />} />
            <Route path=":id/editar" element={<FormularioUsina />} />
          </Route>

          <Route path="vinculos">
            <Route index element={<ListaVinculos />} />
            <Route path="novo" element={<FormularioVinculo />} />
            <Route path=":id" element={<DetalheVinculo />} /> {/* <--- Rota Nova */}
            <Route path=":id/editar" element={<FormularioVinculo />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // <--- Aqui está a mágica: importamos o arquivo certo!

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Chamamos o componente Sidebar que tem o Simulador e Recibos */}
      <Sidebar />
      
      {/* Área Principal (Com margem esquerda para não ficar embaixo do menu fixo) */}
      <main className="flex-1 ml-64 p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50-bg font-inter overflow-hidden selection:bg-blue-200 selection:text-blue-900">
      <Sidebar />
      
      {/* 🟢 ADICIONADO: ml-20 (Margin Left de 80px) para compensar o tamanho da barra fininha e w-full para ocupar a tela toda */}
      <main className="flex-1 ml-30 w-full overflow-x-hidden overflow-y-auto bg-gray-50-bg relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
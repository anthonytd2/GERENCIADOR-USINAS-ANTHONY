import { useState } from 'react';
import { Outlet } from 'react-router-dom'; // Importamos o Outlet
import Sidebar from './Sidebar';
import { Menu, X, Bell, User } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar para Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-gray-50-card">
            <div className="flex justify-end p-4">
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex flex-1 flex-col md:pl-64 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-gray-50-card/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="md:hidden -ml-2 p-2 text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-1 justify-end gap-4 items-center">
              <button className="p-2 text-gray-500 hover:text-gray-500 relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm  text-gray-900">Anthony</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-brand-light/10 flex items-center justify-center border border-brand-light/20 text-brand-DEFAULT">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Aqui é onde as páginas (Dashboard, Usinas, etc.) aparecem */}
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
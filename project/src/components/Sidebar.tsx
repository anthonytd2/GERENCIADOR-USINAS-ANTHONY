import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Link as LinkIcon, LogOut, Sun } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) 
      ? 'bg-blue-600 text-white shadow-md' // Ativo: Azul Bionova mais claro
      : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'; // Inativo
  };

  return (
    <div className="w-56 bg-[#0B1E3F] min-h-screen flex flex-col shadow-xl z-10 transition-all duration-300"> 
      {/* bg-[#0B1E3F] é o Azul Escuro Profundo estilo Bionova */}
      
      {/* CABEÇALHO DO MENU */}
      <div className="p-5 border-b border-blue-800/50 flex flex-col items-center text-center">
        <div className="bg-blue-600/20 p-3 rounded-full mb-3 ring-2 ring-blue-400/30">
          <Sun className="w-8 h-8 text-yellow-400 fill-yellow-400" />
        </div>
        <h1 className="text-lg font-bold text-white leading-tight">
          Gestão Solar <span className="text-blue-300 block text-sm font-normal">Locações</span>
        </h1>
      </div>

      {/* LINKS DE NAVEGAÇÃO */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 mt-2">
          Principal
        </p>
        
        <Link to="/" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        <p className="px-3 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2 mt-6">
          Cadastros
        </p>

        <Link to="/consumidores" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/consumidores')}`}>
          <Users className="w-4 h-4" />
          Consumidores
        </Link>

        <Link to="/usinas" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/usinas')}`}>
          <Zap className="w-4 h-4" />
          Usinas
        </Link>

        <Link to="/vinculos" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${isActive('/vinculos')}`}>
          <LinkIcon className="w-4 h-4" />
          Vínculos
        </Link>
      </nav>

      {/* RODAPÉ DO MENU */}
      <div className="p-3 border-t border-blue-800/50">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-red-300 hover:bg-red-900/20 hover:text-red-200 rounded-lg transition-all text-sm font-medium">
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
        <p className="text-center text-[10px] text-blue-500 mt-4">
          v2.1.0 • Bionova
        </p>
      </div>
    </div>
  );
}
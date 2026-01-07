import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Link as LinkIcon, LogOut, Sun, FileText } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) 
      ? 'bg-blue-600 text-white shadow-lg' 
      : 'text-blue-100 hover:bg-white/10 hover:text-white';
  };

  return (
    <div className="w-64 bg-[#0B1E3F] h-full flex flex-col shadow-2xl z-20 flex-shrink-0"> 
      
      {/* LOGO */}
      <div className="p-6 border-b border-blue-800/50 flex flex-col items-center text-center">
        <div className="bg-blue-600/20 p-3 rounded-full mb-3 ring-2 ring-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Sun className="w-8 h-8 text-yellow-400 fill-yellow-400" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Gestão Solar <span className="text-blue-400 block text-xs font-medium mt-1 tracking-[0.2em] uppercase">Locações</span>
        </h1>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 opacity-80">
          Principal
        </p>
        
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium tracking-wide ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`}>
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        <p className="px-4 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 mt-8 opacity-80">
          Cadastros
        </p>

        <Link to="/consumidores" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium tracking-wide ${isActive('/consumidores')}`}>
          <Users className="w-5 h-5" />
          Consumidores
        </Link>

        <Link to="/usinas" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium tracking-wide ${isActive('/usinas')}`}>
          <Zap className="w-5 h-5" />
          Usinas
        </Link>

        <Link to="/vinculos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium tracking-wide ${isActive('/vinculos')}`}>
          <LinkIcon className="w-5 h-5" />
          Vínculos
        </Link>

        {/* --- NOVO BOTÃO DE RECIBOS --- */}
        <Link to="/recibos" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium tracking-wide ${isActive('/recibos')}`}>
          <FileText className="w-5 h-5" />
          Emitir Recibos
        </Link>
      </nav>

      {/* RODAPÉ */}
      <div className="p-4 border-t border-blue-800/50 bg-[#08162e]">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-red-300 hover:bg-red-900/20 hover:text-red-200 rounded-xl transition-all font-medium tracking-wide group">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
import { Link, useLocation } from 'react-router-dom';
// 1. ADICIONE BarChart3 AQUI NOS IMPORTS
import { LayoutDashboard, Sun, Users, Link as LinkIcon, FileText, Calculator, LogOut, BarChart3 } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Consumidores', path: '/consumidores' },
    { icon: Sun, label: 'Usinas', path: '/usinas' },
    { icon: LinkIcon, label: 'Vínculos', path: '/vinculos' },
    { icon: FileText, label: 'Recibos', path: '/recibos' },
    { icon: Calculator, label: 'Simulações', path: '/propostas' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: FileText, label: 'Protocolos', path: '/protocolos' },    
    { icon: FileText, label: 'Emitir Minutas', path: '/financeiro/minutas' },
  ];

  return (
    <aside className="w-64 bg-brand-dark text-white min-h-screen flex flex-col shadow-2xl z-10">
      <div className="p-6 border-b border-blue-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/50">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Solar Locações</h1>
            <p className="text-xs text-blue-300">Painel Administrativo</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                ${active 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.5)]"></div>}
              
              <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-blue-900/50">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-blue-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
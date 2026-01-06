import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, Link as LinkIcon, LogOut } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const menuItems = [
    { path: '/consumidores', icon: Users, label: 'Consumidores' },
    { path: '/usinas', icon: Zap, label: 'Usinas' },
    { path: '/vinculos', icon: LinkIcon, label: 'Vínculos' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* MENU LATERAL AZUL ESCURO (Estilo Corporativo) */}
      <aside className="w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl">
        
        {/* Logo / Título */}
        <div className="h-24 flex items-center px-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
              <LayoutDashboard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Gestão Solar</h1>
              <p className="text-xs text-slate-400 font-medium">Painel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                <span className="font-medium text-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-auto">
        <div className="p-10 max-w-7xl mx-auto">
          {/* Card Branco Arredondado para o Conteúdo */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 min-h-[85vh]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  Link as LinkIcon, 
  FileText,
  Calculator,
  DollarSign // Novo ícone para o financeiro
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Consumidores', path: '/consumidores' },
  { icon: Zap, label: 'Usinas', path: '/usinas' },
  { icon: LinkIcon, label: 'Vínculos', path: '/vinculos' },
  { icon: FileText, label: 'Recibos', path: '/recibos' },
  { icon: Calculator, label: 'Simulador', path: '/simulador' },
  // Novo item Financeiro
  { icon: DollarSign, label: 'Fechamento', path: '/financeiro/fechamento' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col fixed left-0 top-0 h-full overflow-y-auto z-50">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Zap className="w-8 h-8 text-blue-600 fill-current" />
          Gestão Solar
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Verifica se está ativo (exato ou sub-rota, exceto para dashboard que é exato)
          const isActive = item.path === '/' 
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 mt-auto">
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase">Sistema</p>
          <p className="text-sm font-medium text-gray-900">Bionova Solar V3.0</p>
        </div>
      </div>
    </aside>
  );
}
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sun, Users, Link as LinkIcon, FileText, Calculator, LogOut, BarChart3, Wallet, MapPin, Activity } from 'lucide-react';
import { supabaseClient } from '../lib/supabaseClient'; 
import toast from 'react-hot-toast';

export default function Sidebar() {
  const location = useLocation();
  
  // 🟢 A MÁGICA DO RETRÁTIL: Estado que controla se o mouse está por cima da barra
  const [isHovered, setIsHovered] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      toast.success('Sessão encerrada com segurança!');
    } catch (error: any) {
      toast.error('Erro ao sair: ' + error.message);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wallet, label: 'Caixa / Financeiro', path: '/financeiro' },
    { icon: Users, label: 'Consumidores', path: '/consumidores' },
    { icon: Sun, label: 'Usinas', path: '/usinas' },
    { icon: MapPin, label: 'Central de Alocação', path: '/alocacao' },
    { icon: LinkIcon, label: 'Vínculos', path: '/vinculos' },
    { icon: FileText, label: 'Recibos', path: '/recibos' },
    { icon: Calculator, label: 'Propostas Salvas', path: '/propostas' },
    { icon: Activity, label: 'Simulador Rápido', path: '/simulador' }, // 🟢 NOSSO NOVO BOTÃO
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: FileText, label: 'Protocolos', path: '/protocolos' },    
    { icon: FileText, label: 'Emitir Minutas', path: '/financeiro/minutas' },
  ];

  return (
    <aside 
      // 🟢 DETECTA O MOUSE ENTRANDO E SAINDO
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // 🟢 SE HOVER: w-64 (aberta). SE NÃO: w-20 (fininha). A transição faz o efeito de deslizar.
      className={`${isHovered ? 'w-64' : 'w-20'} bg-brand-dark text-white min-h-screen flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out relative`}
    >
      {/* CABEÇALHO DA SIDEBAR */}
      <div className={`p-6 border-b border-blue-900/50 flex items-center transition-all duration-300 ${isHovered ? 'justify-start gap-3' : 'justify-center'}`}>
        <div className="p-2 bg-blue-500 rounded-lg shadow-sm shadow-blue-500/50 shrink-0">
          <Sun className="w-6 h-6 text-white" />
        </div>
        {/* Esconde o texto se não estiver no hover */}
        {isHovered && (
          <div className="whitespace-nowrap animate-fade-in text-left">
            <h1 className="text-xl font-bold tracking-tight">Solar Locações</h1>
            <p className="text-xs text-blue-300">Painel Administrativo</p>
          </div>
        )}
      </div>

      {/* ÁREA DOS BOTÕES (COM ROLAGEM) */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-800/30 hover:[&::-webkit-scrollbar-thumb]:bg-blue-600 [&::-webkit-scrollbar-thumb]:rounded-full">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              // Se estiver fininha (sem hover), mostramos um balão nativo (title) com o nome do menu
              title={!isHovered ? item.label : undefined}
              className={`flex items-center gap-3 py-3 rounded-xl transition-all duration-200 group relative
                ${active 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm shadow-blue-900/50' 
                  : 'text-blue-100 hover:bg-gray-50-card/10 hover:text-white'
                }
                ${isHovered ? 'px-4' : 'justify-center px-0'} 
              `}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 shadow-[0_0_10px_rgba(147,197,253,0.5)]"></div>}
              
              <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-white' : 'text-blue-300 group-hover:text-white'}`} />
              
              {/* Esconde os textos dos menus se não estiver no hover */}
              {isHovered && <span className="whitespace-nowrap font-medium animate-fade-in">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* BOTÃO DE SAÍDA */}
      <div className="p-4 border-t border-blue-900/50">
        <button 
          onClick={handleLogout}
          title={!isHovered ? "Sair do Sistema" : undefined}
          className={`flex items-center gap-3 py-3 w-full text-blue-300 hover:text-white hover:bg-red-500/10 rounded-xl transition-all duration-200 group ${isHovered ? 'px-4' : 'justify-center'}`}
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-red-400" />
          {isHovered && <span className="group-hover:text-red-400 whitespace-nowrap font-bold animate-fade-in">Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
}
import React from 'react';
import { createPortal } from 'react-dom'; // 🟢 NOVO: Importação do Portal
import { AlertTriangle, X } from 'lucide-react';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ModalConfirmacao({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDestructive = false
}: ModalConfirmacaoProps) {
  
  if (!isOpen) return null;

  // 🟢 NOVO: Envolvendo tudo no createPortal e enviando para o document.body
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      
      {/* 🟢 CORREÇÃO: Substituído bg-gray-50-card por bg-white */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-100">
        
        {/* Cabeçalho */}
        <div className="p-6 pb-0 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full shadow-sm ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6">
          <p className="text-slate-600 font-medium leading-relaxed">{message}</p>
        </div>

        {/* Rodapé (Botões) */}
        <div className="p-6 pt-4 flex justify-end gap-3 bg-slate-50/50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-white hover:shadow-sm transition-all text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-md transition-all transform active:scale-95 text-sm ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body // 🟢 Destino do Portal
  );
}
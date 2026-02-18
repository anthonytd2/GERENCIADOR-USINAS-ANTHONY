import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  // Estilo Base (O que todo botão tem igual)
  const base = "px-4 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  // Variantes (As "roupas" do botão)
  const variants = {
    primary: "bg-brand-DEFAULT text-white hover:bg-brand-dark shadow-sm shadow-brand-DEFAULT/20",
    secondary: "bg-gray-50 text-texto border border-gray-200 hover:bg-gray-50-hover hover:border-brand-light/50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
    ghost: "bg-transparent text-texto-secundario hover:text-texto hover:bg-gray-50-hover"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}
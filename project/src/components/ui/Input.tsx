import React from 'react';

// Aceita todas as propriedades de um input normal
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

// O 'forwardRef' é necessário para funcionar com o React Hook Form
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm  text-texto-secundario mb-1.5 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-texto outline-none focus:ring-2 focus:ring-brand-light/50 focus:border-brand-light transition-all placeholder:text-gray-500 ${className}`}
          {...props}
        />
      </div>
    );
  }
);
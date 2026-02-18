import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    // Note o uso de 'bg-gray-50-card' e 'border-gray-200' que criamos na configuração
    <div className={`bg-gray-50-card border border-gray-200 rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}
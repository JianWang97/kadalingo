import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white rounded-xl shadow-lg p-6 ${className} ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow' : ''}`}
      onClick={onClick}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {title}
      </h2>
      <div className="text-gray-600">
        {children}
      </div>
    </div>
  );
};

export default Card;

import React from 'react';
import { Plus, Trash2, Download, RefreshCw, Undo, MapPin, ChevronLeft, Table, Layout, ArrowRight, Grid, AlignCenter } from 'lucide-react';

export const Icons = {
  Plus,
  Trash: Trash2,
  Download,
  Refresh: RefreshCw,
  Back: ChevronLeft,
  Pin: MapPin,
  Undo,
  Table,
  Layout,
  ArrowRight,
  Grid,
  AlignCenter
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  variant = 'ghost', 
  className = "", 
  ...props 
}) => {
  const variants = {
    primary: "text-blue-600 hover:bg-blue-100",
    danger: "text-red-400 hover:text-red-600 hover:bg-red-50",
    ghost: "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
    success: "text-green-600 hover:bg-green-100",
  };

  return (
    <button
      type="button"
      className={`p-1 rounded transition-colors no-export ${variants[variant]} ${className}`}
      {...props}
    >
      <Icon size={16} />
    </button>
  );
};
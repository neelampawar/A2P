import React from 'react';
import { ShoppingBag, Search, MapPin, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onSearchClick: () => void;
  onProfileClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearchClick, onProfileClick }) => {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        {/* Brand & Location */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-brand-yellow tracking-tight leading-none">
            blink<span className="text-brand-green">agent</span>
          </h1>
          <div className="flex items-center text-xs font-medium text-gray-500 mt-1">
            <span className="font-bold text-gray-800">12 mins</span>
            <span className="mx-1">•</span>
            <span className="truncate max-w-[100px]">Home - 123 Main St</span>
            <MapPin className="w-3 h-3 ml-1" />
          </div>
        </div>

        {/* Search Trigger */}
        <div 
          onClick={onSearchClick}
          className="flex-1 bg-gray-100 rounded-lg px-3 py-2 flex items-center gap-2 cursor-text"
        >
          <Search className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Ask Agent...</span>
        </div>

        {/* Profile */}
        <div className="cursor-pointer bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors" onClick={onProfileClick}>
           <User className="w-5 h-5 text-gray-700" />
        </div>

        {/* Cart */}
        <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
           <ShoppingBag className="w-6 h-6 text-gray-700" />
           {totalItems > 0 && (
             <span className="absolute -top-1 -right-1 bg-brand-green text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
               {totalItems}
             </span>
           )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
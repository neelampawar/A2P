import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import AgentBar from './components/AgentBar';
import ProductCard from './components/ProductCard';
import CartSheet from './components/CartSheet';
import ProfileModal from './components/ProfileModal';
import AgentCheckout from './components/AgentCheckout'; // <--- The new component
import { CartProvider } from './context/CartContext';
import { PaymentProvider } from './context/PaymentContext';
import { MOCK_PRODUCTS, CATEGORIES } from './constants';

function App() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Logic to filter products based on the top rail selection
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All') return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  return (
    // PaymentProvider: Holds user's saved cards/history logic
    <PaymentProvider>
      {/* CartProvider: Holds the list of items the Agent adds */}
      <CartProvider>
        <div className="min-h-screen bg-gray-50 pb-20 relative">
          
          {/* Top Navigation */}
          <Navbar 
            onSearchClick={() => setIsAgentOpen(true)} 
            onProfileClick={() => setIsProfileOpen(true)}
          />
          
          {/* Sticky Category Rail */}
          <div className="sticky top-[68px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 py-3 shadow-sm">
             <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
               <button 
                 onClick={() => setActiveCategory('All')}
                 className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === 'All' ? 'bg-brand-green text-white shadow-md shadow-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               >
                 All
               </button>
               {CATEGORIES.map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? 'bg-brand-green text-white shadow-md shadow-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                   {cat}
                 </button>
               ))}
             </div>
          </div>

          {/* Hero Banner with Agent Trigger */}
          <div className="px-4 py-6">
             <div className="w-full aspect-[21/9] bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg relative overflow-hidden flex items-center px-6">
                <div className="text-white relative z-10">
                   <h2 className="text-2xl font-bold mb-1">10 Minute Grocery</h2>
                   <p className="text-sm font-medium opacity-90 mb-3">Freshness you can trust</p>
                   {/* This button opens the Agent Bar */}
                   <button 
                     onClick={() => setIsAgentOpen(true)} 
                     className="bg-white text-orange-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:scale-105 transition-transform"
                   >
                     Ask Agent to Shop
                   </button>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
             </div>
          </div>

          {/* Main Product Grid */}
          <div className="px-4 pb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{activeCategory === 'All' ? 'Recommended for You' : activeCategory}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
               {filteredProducts.map(product => (
                 <ProductCard key={product.id} product={product} />
               ))}
            </div>
            {filteredProducts.length === 0 && (
               <div className="py-20 text-center text-gray-400">
                  No products found in this category.
               </div>
            )}
          </div>

          {/* --- OVERLAYS --- */}

          {/* The AI Agent Bar (Voice/Text Input) */}
          <AgentBar isOpen={isAgentOpen} onClose={() => setIsAgentOpen(false)} />
          
          {/* Standard Cart Sidebar (Optional manual view) */}
          <CartSheet />
          
          {/* Profile Modal */}
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
          
          {/* THE AP2 CHECKOUT LOGIC */}
          {/* This component stays hidden until items are in the cart, then appears at bottom-right */}
          <AgentCheckout />

        </div>
      </CartProvider>
    </PaymentProvider>
  );
}

export default App;
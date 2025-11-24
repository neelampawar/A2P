import React, { useState } from 'react';
import { X, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import CheckoutModal from './CheckoutModal';

const CartItemRow: React.FC<{ item: any, onInc: any, onDec: any }> = ({ item, onInc, onDec }) => (
  <div className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
      <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
    </div>
    <div className="flex-1 flex flex-col justify-between">
       <div className="flex justify-between items-start">
         <div className="text-sm text-gray-800 font-medium line-clamp-1">{item.name}</div>
         <div className="text-sm font-bold">₹{item.price * item.quantity}</div>
       </div>
       <div className="text-xs text-gray-500">{item.weight}</div>
       
       <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center bg-brand-green text-white rounded-md h-7 px-1">
              <button onClick={() => onDec(item.id)} className="w-6 flex items-center justify-center hover:bg-green-700 rounded-l"><span className="text-lg leading-none">-</span></button>
              <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
              <button onClick={() => onInc(item.id, 1)} className="w-6 flex items-center justify-center hover:bg-green-700 rounded-r"><span className="text-lg leading-none">+</span></button>
          </div>
       </div>
    </div>
  </div>
);

const CartSheet: React.FC = () => {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isCartOpen) return null;

  const handleDecrement = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.quantity === 1) removeFromCart(id);
    else updateQuantity(id, -1);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            My Cart <span className="bg-brand-yellow/30 text-xs px-2 py-0.5 rounded-full text-yellow-800">{items.length} items</span>
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-800">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Start adding items from the home screen.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-6 px-6 py-2 bg-brand-green text-white rounded-lg font-medium"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Delivery Tip */}
              <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-xl shrink-0">⚡</div>
                <div>
                   <p className="text-xs font-bold text-blue-900">Delivery in 12 minutes</p>
                   <p className="text-[10px] text-blue-700">Shipment of {items.length} items</p>
                </div>
              </div>

              {items.map(item => (
                <CartItemRow 
                  key={item.id} 
                  item={item} 
                  onInc={updateQuantity} 
                  onDec={handleDecrement} 
                />
              ))}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="font-bold text-sm mb-3">Bill Details</h3>
                <div className="space-y-2 text-xs text-gray-600">
                   <div className="flex justify-between"><span>Item Total</span><span>₹{totalAmount}</span></div>
                   <div className="flex justify-between"><span>Delivery Charge</span><span className="text-green-600 line-through">₹25</span><span className="text-green-600">FREE</span></div>
                   <div className="flex justify-between"><span>Handling Charge</span><span>₹2</span></div>
                   <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm text-gray-900">
                     <span>To Pay</span>
                     <span>₹{totalAmount + 2}</span>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Action */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white">
             <button 
               onClick={() => setShowCheckout(true)}
               className="w-full bg-brand-green hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-between px-4 transition-colors shadow-lg shadow-green-200"
             >
               <div className="flex flex-col items-start leading-none">
                 <span className="text-[10px] font-normal opacity-80 uppercase">Total</span>
                 <span>₹{totalAmount + 2}</span>
               </div>
               <div className="flex items-center gap-1">
                 Proceed to Pay <ChevronRight className="w-4 h-4" />
               </div>
             </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal 
          amount={totalAmount + 2} 
          onClose={() => setShowCheckout(false)} 
          onSuccess={() => {
            setShowCheckout(false);
            setIsCartOpen(false);
            clearCart();
          }}
        />
      )}
    </>
  );
};

export default CartSheet;
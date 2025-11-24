import React, { useState } from 'react';
import { X, User, ShoppingBag, CreditCard, Trash2, Clock, CheckCircle2, Package, ShieldCheck } from 'lucide-react';
import { usePayment } from '../context/PaymentContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'payment'>('history');
  const { orders, savedCard, revokeAuthorization, isLoading } = usePayment();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-6 bg-brand-dark text-white flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-xl font-bold border border-white/20">
              U
            </div>
            <div>
              <h2 className="text-lg font-bold">User Profile</h2>
              <p className="text-xs text-white/60">+91 98765 43210</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'text-brand-green border-b-2 border-brand-green bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Order History
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'payment' ? 'text-brand-green border-b-2 border-brand-green bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <CreditCard className="w-4 h-4" /> Payment Methods
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
          
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400 gap-2">
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              Loading Database...
            </div>
          ) : activeTab === 'history' ? (
            // --- HISTORY TAB ---
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">No past orders found.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-brand-green" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">Delivered</p>
                          <p className="text-[10px] text-gray-400">{new Date(order.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold">₹{order.amount}</span>
                    </div>
                    
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        <CreditCard className="w-3 h-3" />
                        {order.paymentMethod}
                      </div>
                      <span className="text-[10px] text-gray-400">ID: {order.id.split('-')[1]}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // --- PAYMENT TAB ---
            <div className="space-y-4">
               {savedCard ? (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                   <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 rounded-full bg-white/10 blur-xl"></div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-green-400" />
                          <span className="text-xs font-bold tracking-wider opacity-80">AGENT AUTHORIZED</span>
                        </div>
                        <CreditCard className="w-6 h-6 opacity-80" />
                      </div>
                      <div className="mt-4 mb-2 font-mono text-xl tracking-widest">
                        •••• •••• •••• {savedCard.last4}
                      </div>
                      <div className="flex justify-between text-[10px] uppercase opacity-60">
                         <span>{savedCard.brand}</span>
                         <span>EXP {savedCard.expiry}</span>
                      </div>
                   </div>
                   
                   <div className="p-4 bg-white">
                     <div className="flex items-start gap-2 mb-4">
                       <div className="bg-green-50 p-1 rounded text-brand-green mt-0.5"><Clock className="w-3 h-3" /></div>
                       <div className="text-xs text-gray-600">
                         This card is authorized for <strong>one-click Agent payments</strong>. The actual card details are tokenized securely in AlloyDB.
                       </div>
                     </div>
                     <button 
                       onClick={revokeAuthorization}
                       className="w-full py-2 border border-red-100 text-red-500 text-xs font-bold rounded-lg hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                     >
                       <Trash2 className="w-3 h-3" /> Remove & Revoke Access
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-300">
                    <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-sm font-bold text-gray-700">No Authorized Cards</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Save a card during checkout to enable 1-tap Agent payments.
                    </p>
                 </div>
               )}
               
               <div className="text-[10px] text-center text-gray-400 mt-6">
                 Secured by Google AlloyDB & Agent Payments Protocol (AP2)
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
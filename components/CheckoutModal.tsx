import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Server, Lock, CheckCircle2, Zap, Wifi, AlertCircle } from 'lucide-react';
import { simulateAP2Payment } from '../services/mockAp2Service';
import { PaymentStep } from '../types';
import { usePayment } from '../context/PaymentContext';
import { useCart } from '../context/CartContext';

interface CheckoutModalProps {
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Basic Luhn Algorithm for validation
const isValidCard = (val: string) => {
  if (!val) return false;
  let nCheck = 0, bEven = false;
  const value = val.replace(/\D/g, "");
  for (let n = value.length - 1; n >= 0; n--) {
    const cDigit = value.charAt(n);
    let nDigit = parseInt(cDigit, 10);
    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }
    nCheck += nDigit;
    bEven = !bEven;
  }
  return (nCheck % 10) == 0 && value.length >= 13;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ amount, onClose, onSuccess }) => {
  const { savedCard, isAgentAuthorized, authorizeAgent, revokeAuthorization, recordOrder } = usePayment();
  const { items } = useCart();
  
  const [step, setStep] = useState<PaymentStep>(PaymentStep.IDLE);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [shouldAuthorize, setShouldAuthorize] = useState(true);

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== PaymentStep.IDLE && step !== PaymentStep.FAILED) return;
    setError(null);
    
    // Validation for new cards
    if (!savedCard) {
      if (!cardNumber || !expiry || !cvc) {
        setError("Please fill in all card details.");
        return;
      }
      if (!isValidCard(cardNumber)) {
        setError("Invalid card number. Please check the digits.");
        return;
      }
    }

    setLogs([]);
    const success = await simulateAP2Payment(amount, (newStep, logMsg) => {
      setStep(newStep);
      addLog(logMsg);
    });

    if (success) {
      // 1. Save Card Authorization if requested
      let usedCardLabel = "Credit Card";
      
      if (!savedCard && shouldAuthorize) {
        const last4 = cardNumber.replace(/\D/g, '').slice(-4);
        const brand = cardNumber.startsWith('4') ? 'Visa' : 'MasterCard'; // Simplified
        await authorizeAgent({
          last4,
          brand: brand as any,
          expiry: expiry,
          holder: 'Agent User' 
        });
        usedCardLabel = `Agent (${brand} ...${last4})`;
      } else if (savedCard) {
        usedCardLabel = `Agent (${savedCard.brand} ...${savedCard.last4})`;
      } else {
        usedCardLabel = `Card (...${cardNumber.slice(-4)})`;
      }

      // 2. Record Order in "AlloyDB"
      await recordOrder(
        amount,
        items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        usedCardLabel
      );
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else {
      setError("Payment failed. Please try again.");
    }
  };

  // Determine UI state based on step
  const isProcessing = step === PaymentStep.IDENTIFYING || step === PaymentStep.CREATING_INTENT || step === PaymentStep.PROCESSING;
  const isSuccess = step === PaymentStep.SUCCESS;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-green" />
            <span className="font-bold text-gray-800">Secure Checkout</span>
          </div>
          {!isProcessing && !isSuccess && (
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
             <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-300">
               <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                 <CheckCircle2 className="w-10 h-10 text-brand-green" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">Payment Successful</h3>
               <p className="text-gray-500 mt-2 text-center">Your order has been recorded in AlloyDB.</p>
             </div>
          ) : (
            <>
              <div className="mb-6">
                 <h2 className="text-2xl font-bold text-gray-900 mb-1">₹{amount}</h2>
                 <p className="text-sm text-gray-500">Total payable amount</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {savedCard && isAgentAuthorized ? (
                /* === AUTHORIZED AGENT VIEW === */
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-xl mb-6">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold tracking-wider flex items-center gap-1 border border-white/10">
                          <Zap className="w-3 h-3 text-yellow-400" fill="currentColor" />
                          AGENT AUTHORIZED
                        </div>
                        <CreditCard className="w-6 h-6 text-white/80" />
                      </div>
                      
                      <div className="font-mono text-xl tracking-widest mb-2 text-shadow">
                        •••• •••• •••• {savedCard.last4}
                      </div>
                      
                      <div className="flex justify-between items-end text-xs text-white/70">
                        <div>
                          <div className="uppercase text-[10px] opacity-60">Card Holder</div>
                          <div>{savedCard.holder}</div>
                        </div>
                        <div>
                           <div className="uppercase text-[10px] opacity-60">Expires</div>
                           <div>{savedCard.expiry}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs flex items-start gap-2 mb-6 border border-green-100">
                    <Wifi className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Agent Protocol Active.</strong> Your card is tokenized in the DB. The agent will process this payment autonomously upon confirmation.
                    </div>
                  </div>
                  
                  <button onClick={revokeAuthorization} className="text-xs text-red-500 hover:text-red-700 underline mb-4 w-full text-center">
                    Use a different card / Revoke authorization
                  </button>
                </div>
              ) : (
                /* === STANDARD FORM VIEW === */
                <div className="space-y-4 mb-6">
                  <label className={`block border rounded-xl p-4 cursor-pointer transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : 'hover:border-brand-green border-brand-green bg-green-50/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <input type="radio" checked readOnly className="w-4 h-4 text-brand-green accent-brand-green" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-semibold text-gray-900">Card via Agent Protocol</span>
                           <span className="bg-brand-yellow text-[10px] font-bold px-1.5 rounded text-yellow-900">AP2 ENABLED</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Securely processed using the Google & PayPal Agent Payments Protocol (AP2). 
                        </p>
                      </div>
                      <CreditCard className="w-6 h-6 text-gray-400" />
                    </div>
                    
                    {/* Card Form */}
                    <div className="mt-4 pt-4 border-t border-gray-200/50 grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                         <input 
                           type="text" 
                           placeholder="Card Number" 
                           maxLength={19}
                           className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-green outline-none"
                           value={cardNumber}
                           onChange={e => setCardNumber(e.target.value)}
                           disabled={isProcessing}
                         />
                      </div>
                      <div>
                         <input 
                           type="text" 
                           placeholder="MM/YY"
                           maxLength={5} 
                           className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-green outline-none"
                           value={expiry}
                           onChange={e => setExpiry(e.target.value)}
                           disabled={isProcessing}
                         />
                      </div>
                      <div>
                         <input 
                           type="password" 
                           placeholder="CVC" 
                           maxLength={3}
                           className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-green outline-none"
                           value={cvc}
                           onChange={e => setCvc(e.target.value)}
                           disabled={isProcessing}
                         />
                      </div>
                    </div>
                  </label>

                  {/* Authorization Toggle */}
                  <label className="flex items-start gap-2 p-3 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      checked={shouldAuthorize}
                      onChange={(e) => setShouldAuthorize(e.target.checked)}
                      className="mt-1 w-4 h-4 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-gray-800">Authorize Agent for future payments</div>
                      <div className="text-gray-500">Securely save to AlloyDB so you don't have to enter details again.</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Protocol Visualizer */}
              {isProcessing && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs space-y-1 mb-6 shadow-inner max-h-40 overflow-y-auto no-scrollbar border border-gray-800">
                  <div className="flex items-center gap-2 border-b border-gray-800 pb-2 mb-2">
                    <Server className="w-3 h-3" />
                    <span className="uppercase tracking-wider text-gray-400">PayPal Agent Protocol Log</span>
                  </div>
                  {logs.map((log, i) => (
                    <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="opacity-50 mr-2">{'>'}</span>{log}
                    </div>
                  ))}
                  <div className="animate-pulse">_</div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isProcessing 
                    ? 'bg-gray-100 text-gray-400 cursor-wait' 
                    : 'bg-brand-green text-white hover:bg-green-700 shadow-lg shadow-green-200'
                }`}
              >
                {isProcessing ? (
                  <>
                     <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                     Processing AP2...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {savedCard ? `Confirm & Pay ₹${amount}` : `Pay ₹${amount}`}
                  </>
                )}
              </button>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 p-3 text-[10px] text-gray-400 text-center border-t border-gray-100">
           Simulated Environment. Do not use real card details. <br/> Implements client-side simulation of Google AlloyDB & AP2 Protocol.
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
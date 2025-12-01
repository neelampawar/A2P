import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { executeAP2Transaction, getVerboseLogs } from '../services/paymentService';
import { PaymentStep } from '../types';
import { ShieldCheck, Server, CreditCard, CheckCircle, AlertCircle, Loader2, ChevronDown, Code } from 'lucide-react';

const AgentCheckout: React.FC = () => {
  const { items, totalAmount, clearCart, isCheckoutOpen, setIsCheckoutOpen } = useCart();
  const [status, setStatus] = useState<PaymentStep>(PaymentStep.IDLE);
  const [logs, setLogs] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [verboseMode, setVerboseMode] = useState(false);
  const [showMandateInspector, setShowMandateInspector] = useState(false);

  // This function connects the UI to your Service
  const handlePay = async () => {
    if (items.length === 0) return;

    setStatus(PaymentStep.IDENTIFYING);
    setLogs([]);
    setIsExpanded(true);

    // Convert Cart Items for the API
    const simpleItems = items.map(i => ({ name: i.name, quantity: i.quantity }));

    // Call the AP2 Service with verbose mode
    const success = await executeAP2Transaction(
      simpleItems,
      "bugsbunny@gmail.com", 
      "Acme Bank Visa ending in 4242",
      (step, log) => {
        setStatus(step);
        setLogs(prev => [...prev, log]);
      },
      { verboseMode }
    );

    // Handle Result
    if (success) {
      setTimeout(clearCart, 2000);
    }
  };

  // Auto-trigger payment when agent initiates checkout
  useEffect(() => {
    if (isCheckoutOpen && status === PaymentStep.IDLE && items.length > 0) {
      // Reset checkout flag and start payment
      setIsCheckoutOpen(false);
      handlePay();
    }
  }, [isCheckoutOpen, status, items.length, setIsCheckoutOpen]);

  const toggleVerboseMode = () => {
    setVerboseMode(!verboseMode);
  };

  const toggleMandateInspector = () => {
    setShowMandateInspector(!showMandateInspector);
  };

  if (items.length === 0 && status === PaymentStep.IDLE) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      
      {/* MANDATE INSPECTOR MODAL */}
      {showMandateInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl max-h-96 overflow-auto p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Code className="w-5 h-5" /> AP2 Transaction Logs
              </h3>
              <button
                onClick={toggleMandateInspector}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {getVerboseLogs().map((log, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-gray-900">[{log.stage}]</span>
                    <span className="text-xs text-gray-500">{log.timestamp.split('T')[1].split('.')[0]}</span>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">{log.description}</p>
                  <p className="text-xs text-blue-600 font-medium">Agent: {log.agent}</p>
                  {log.nextAction && (
                    <p className="text-xs text-orange-600 mt-1">→ Next: {log.nextAction}</p>
                  )}
                  {log.payload && (
                    <details className="mt-2 cursor-pointer">
                      <summary className="text-xs text-gray-600 hover:text-gray-900">
                        View Payload
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGS PANEL (Visualizing the Protocol) */}
      {isExpanded && (
        <div className="bg-slate-900 text-green-400 p-4 rounded-xl shadow-2xl w-80 font-mono text-xs border border-slate-700 animate-in slide-in-from-bottom-5">
          <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
            <span className="font-bold flex items-center gap-2">
              <Server className="w-3 h-3" /> AP2 Protocol Log
            </span>
            <button onClick={() => setIsExpanded(false)} className="text-slate-500 hover:text-white">✕</button>
          </div>
          <div className="h-48 overflow-y-auto space-y-2 scrollbar-thin">
            {logs.map((log, i) => (
              <div key={i} className="border-l-2 border-green-800 pl-2">
                <span className="opacity-50">[{new Date().toLocaleTimeString().split(' ')[0]}]</span> {log}
              </div>
            ))}
            {status === PaymentStep.PROCESSING && (
              <div className="animate-pulse">_ Waiting for agent signal...</div>
            )}
          </div>

          {/* Verbose Mode Info */}
          {verboseMode && (
            <div className="mt-3 pt-2 border-t border-slate-700 text-yellow-400 text-xs">
              <button
                onClick={toggleMandateInspector}
                className="hover:text-yellow-300 underline"
              >
                📋 View detailed mandate inspection
              </button>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT CARD */}
      <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 w-80">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Due</p>
            <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{items.length} Items</p>
          </div>
        </div>

        {/* Verbose Mode Toggle */}
        <div className="mb-3 flex items-center gap-2 pb-3 border-b border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={verboseMode}
              onChange={toggleVerboseMode}
              disabled={status !== PaymentStep.IDLE}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-xs text-gray-700">
              Verbose Mode
              <span className="ml-1 text-gray-400">(debug info)</span>
            </span>
          </label>
        </div>

        <button
          onClick={handlePay}
          disabled={status !== PaymentStep.IDLE && status !== PaymentStep.FAILED && status !== PaymentStep.SUCCESS}
          className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all
            ${status === PaymentStep.IDLE ? 'bg-black text-white hover:bg-gray-800' : ''}
            ${status === PaymentStep.SUCCESS ? 'bg-green-500 text-white' : ''}
            ${status === PaymentStep.FAILED ? 'bg-red-500 text-white' : ''}
            ${status === PaymentStep.IDENTIFYING || status === PaymentStep.CREATING_INTENT || status === PaymentStep.PROCESSING ? 'bg-blue-600 text-white' : ''}
          `}
        >
          {status === PaymentStep.IDLE && (
            <>
              <ShieldCheck className="w-4 h-4" /> Pay with Agent
            </>
          )}
          
          {(status === PaymentStep.IDENTIFYING || status === PaymentStep.CREATING_INTENT || status === PaymentStep.PROCESSING) && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          )}

          {status === PaymentStep.SUCCESS && (
            <>
              <CheckCircle className="w-4 h-4" /> Paid Successfully
            </>
          )}

          {status === PaymentStep.FAILED && (
            <>
              <AlertCircle className="w-4 h-4" /> Payment Failed
            </>
          )}
        </button>

        {/* Status Text */}
        {status !== PaymentStep.IDLE && (
          <div className="mt-3 text-[10px] text-center text-gray-400 flex items-center justify-center gap-1 cursor-pointer" onClick={() => setIsExpanded(true)}>
             <Server className="w-3 h-3" /> 
             {status === PaymentStep.SUCCESS ? 'AP2 Transaction Complete' : 'Secure Agent Channel Active'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCheckout;
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, X, Mic, MicOff, Send, ShoppingCart, CreditCard } from 'lucide-react';
import { createShoppingChat, getCachedImage, logAgentActionToBackend } from '../services/geminiService';
import { executeAP2Transaction } from '../services/paymentService';
import { MOCK_PRODUCTS } from '../constants';
import { useCart } from '../context/CartContext';
import { Chat, GenerateContentResponse } from '@google/genai';
import { AgentActionType, AgentResponse, PaymentStep } from '../types';

interface AgentBarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'agent';
  text: string;
  type?: AgentActionType;
}

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const AgentBar: React.FC<AgentBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStep>(PaymentStep.IDLE);
  
  const { addToCart, setIsCheckoutOpen, items, totalAmount, clearCart } = useCart();
  const recognitionRef = useRef<any>(null);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatRef.current) {
      const productList = MOCK_PRODUCTS.map(p => p.name);
      chatRef.current = createShoppingChat(productList);
      setMessages([{ role: 'agent', text: "Hi! I can help you shop. What do you need today?" }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech
  useEffect(() => {
    if (!isOpen) {
      setIsListening(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [isOpen]);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
      handleAgentSubmit(undefined, transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processAgentResponse = (response: AgentResponse) => {
    // Add Agent Message
    setMessages(prev => [...prev, { role: 'agent', text: response.message, type: response.type }]);

    // Execute Actions
    if (response.type === AgentActionType.ADD_TO_CART && response.items) {
      response.items.forEach(item => {
        const product = MOCK_PRODUCTS.find(p => p.name === item.productName);
        if (product) {
          const cachedImage = getCachedImage(product.id);
          const productToAdd = cachedImage ? { ...product, image: cachedImage } : product;
          addToCart(productToAdd, item.quantity);
        }
      });
      
      // Log to backend
      logAgentActionToBackend('add_to_cart', {
        items: response.items,
        userEmail: 'bugsbunny@gmail.com'
      });
    }

    if (response.type === AgentActionType.INITIATE_CHECKOUT) {
      // Log checkout to backend
      logAgentActionToBackend('initiate_checkout', {
        userEmail: 'bugsbunny@gmail.com',
        source: 'agent'
      });
      
      // Initiate AP2 payment through backend
      setIsProcessingPayment(true);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: 'Great! Let me process your payment securely through our AP2 payment gateway...' 
      }]);
      
      // Small delay then trigger AP2 payment
      setTimeout(() => {
        triggerAP2Payment();
      }, 1500);
      
      return; // Don't close the agent bar yet
    }
    
    // Log all agent responses for audit trail
    logAgentActionToBackend('agent_response', {
      type: response.type,
      message: response.message
    });
  };

  /**
   * Trigger AP2 payment with items currently in cart
   */
  const triggerAP2Payment = async () => {
    if (items.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: 'No items in cart. Please add something first.' 
      }]);
      setIsProcessingPayment(false);
      return;
    }

    try {
      setPaymentStatus(PaymentStep.IDENTIFYING);
      
      const cartItems = items.map(i => ({ name: i.name, quantity: i.quantity }));
      
      const success = await executeAP2Transaction(
        cartItems,
        "bugsbunny@gmail.com",
        "Acme Bank Visa ending in 4242",
        (step, log) => {
          setPaymentStatus(step);
          // Show payment steps to user
          if (step === PaymentStep.SUCCESS) {
            setMessages(prev => [...prev, { 
              role: 'agent', 
              text: `✅ Payment successful! Your order has been placed. Receipt ID: ${Date.now()}` 
            }]);
            clearCart();
            setTimeout(() => {
              onClose();
            }, 2000);
          } else if (step === PaymentStep.FAILED) {
            setMessages(prev => [...prev, { 
              role: 'agent', 
              text: `❌ Payment failed: ${log}. Please try again.` 
            }]);
          }
        },
        { verboseMode: false }
      );

      if (!success) {
        setMessages(prev => [...prev, { 
          role: 'agent', 
          text: 'Payment failed. Please try again or use manual checkout.' 
        }]);
      }
    } catch (error: any) {
      console.error('AP2 Payment error:', error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: `Error during payment: ${error.message || 'Unknown error'}. Please try again.` 
      }]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleAgentSubmit = async (e?: React.FormEvent, manualQuery?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualQuery || query;
    if (!textToSend.trim() || !chatRef.current) return;

    // Add User Message
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: textToSend });
      const jsonText = (result as GenerateContentResponse).text;
      
      if (jsonText) {
        try {
          const responseData = JSON.parse(jsonText) as AgentResponse;
          processAgentResponse(responseData);
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError, "Response:", jsonText);
          setMessages(prev => [...prev, { role: 'agent', text: "I had trouble understanding that response. Could you try again?" }]);
        }
      } else {
        throw new Error("No response from Gemini API");
      }
    } catch (error: any) {
      console.error("Agent Error:", error);
      const errorMsg = error?.message || "I'm having trouble connecting right now. Please try again.";
      setMessages(prev => [...prev, { role: 'agent', text: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[70vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-brand-yellow/10 to-brand-green/10 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-green" fill="currentColor" />
            </div>
            <div>
              <span className="font-bold text-gray-800 block leading-tight">Shopping Assistant</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Powered by Gemini</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-brand-green text-black rounded-tr-sm' 
                    : 'bg-white border border-gray-100 text-black rounded-tl-sm'
                }`}
              >
                {msg.text}
                
                {/* Visual Indicators for Actions */}
                {msg.type === AgentActionType.PROPOSE_CART && (
                   <div className="mt-2 text-[10px] uppercase font-bold text-yellow-400 flex items-center gap-1">
                     <ShoppingCart className="w-3 h-3" /> waiting for confirmation
                   </div>
                )}
                {msg.type === AgentActionType.ADD_TO_CART && (
                   <div className="mt-2 text-[10px] uppercase font-bold text-yellow-300 flex items-center gap-1">
                     <Sparkles className="w-3 h-3" /> Items Added
                   </div>
                )}
                {msg.type === AgentActionType.INITIATE_CHECKOUT && (
                   <div className="mt-2 text-[10px] uppercase font-bold text-yellow-300 flex items-center gap-1">
                     <CreditCard className="w-3 h-3" /> Opening Checkout...
                   </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-brand-green" />
                 <span className="text-xs text-gray-400">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={(e) => handleAgentSubmit(e)} className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-50 text-red-500 animate-pulse ring-2 ring-red-100' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask me to add items..."}
              className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all outline-none text-sm"
              autoFocus
            />
            
            <button 
              type="submit"
              disabled={!query.trim() || isLoading}
              className="p-3 bg-brand-green text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-brand-green transition-colors shadow-sm shadow-green-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-[10px] text-center text-gray-400 mt-2">
            AI can make mistakes. Please check your cart.
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentBar;
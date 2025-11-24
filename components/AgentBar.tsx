import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Loader2, X, Mic, MicOff } from 'lucide-react';
import { getShoppingSuggestions, getCachedImage } from '../services/geminiService';
import { MOCK_PRODUCTS } from '../constants';
import { useCart } from '../context/CartContext';

interface AgentBarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Type definition for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const AgentBar: React.FC<AgentBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { addToCart } = useCart();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setResultMessage(null);
      setQuery('');
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  if (!isOpen) return null;

  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResultMessage(null);

    const productNames = MOCK_PRODUCTS.map(p => p.name);
    const result = await getShoppingSuggestions(query, productNames);

    let addedCount = 0;
    result.items.forEach(item => {
      const product = MOCK_PRODUCTS.find(p => p.name === item.productName);
      if (product) {
        // Try to find if we have an AI generated image for this product
        const cachedImage = getCachedImage(product.id);
        const productToAdd = cachedImage ? { ...product, image: cachedImage } : product;
        
        addToCart(productToAdd);
        addedCount++;
      }
    });

    setIsLoading(false);
    setQuery('');
    setResultMessage(`Agent thought: "${result.thoughtProcess}". Added ${addedCount} items to cart.`);
    
    // Auto close after success after delay
    setTimeout(() => {
        if(addedCount > 0) onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="p-4 bg-gradient-to-r from-brand-yellow/20 to-brand-green/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-green" fill="currentColor" />
            <span className="font-semibold text-gray-800">Agent Shopping Assistant</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {!resultMessage ? (
            <>
              <p className="text-gray-600 mb-4 text-sm">
                Tell me what you want to cook or what you need, and I'll fill your cart for you.
              </p>
              <form onSubmit={handleAgentSubmit} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isListening ? "Listening..." : "e.g., I want to make a spicy salsa..."}
                  className={`w-full pl-4 pr-20 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-gray-800 ${isListening ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-gray-200 focus:ring-brand-green/50'}`}
                  autoFocus
                />
                
                <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'hover:bg-gray-200 text-gray-400'}`}
                    title="Voice Search"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Submit Button */}
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="h-8 w-8 bg-brand-green text-white rounded-lg flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
              {isListening && (
                <p className="text-[10px] text-brand-green font-medium mt-2 animate-pulse flex items-center gap-1">
                   <Mic className="w-3 h-3" /> Listening...
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-4">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Sparkles className="w-6 h-6" />
               </div>
               <p className="text-gray-800 font-medium mb-1">Done!</p>
               <p className="text-gray-600 text-sm italic">"{resultMessage}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentBar;
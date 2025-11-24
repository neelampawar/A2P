import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Plus, Minus, Clock, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { generateProductImage, getCachedImage } from '../services/geminiService';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const cartItem = items.find(i => i.id === product.id);
  const quantity = cartItem?.quantity || 0;
  
  const [displayImage, setDisplayImage] = useState(product.image);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Check if we have a cached AI image first
    const cached = getCachedImage(product.id);
    if (cached) {
      setDisplayImage(cached);
      return;
    }

    // If it's a placeholder (picsum), try to generate a real one
    if (product.image.includes('picsum') || product.image.includes('placeholder')) {
      const loadAiImage = async () => {
        setIsGenerating(true);
        // Queue handled by service, no manual delay needed
        const aiImage = await generateProductImage(product.id, product.name, product.description);
        if (aiImage) {
          setDisplayImage(aiImage);
        }
        setIsGenerating(false);
      };
      
      loadAiImage();
    }
  }, [product.id, product.name, product.description, product.image]);

  const handleDecrement = () => {
    if (quantity === 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, -1);
    }
  };

  const handleAddToCart = () => {
    // Pass the current display image (which might be AI generated) to the cart
    addToCart({ ...product, image: displayImage });
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-white rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group">
      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-50 mb-2 group-hover:shadow-md transition-shadow">
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-brand-yellow" />
            <span className="text-[10px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-green" /> Creating...
            </span>
          </div>
        ) : (
          <img 
            src={displayImage} 
            alt={product.name} 
            className={`object-cover w-full h-full mix-blend-multiply transition-opacity duration-500 ${isGenerating ? 'opacity-0' : 'opacity-100'}`} 
          />
        )}
        
        {!isGenerating && displayImage.startsWith('data:') && (
           <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-md p-1 rounded-full" title="AI Generated Image">
             <Sparkles className="w-3 h-3 text-yellow-300" />
           </div>
        )}

        <div className="absolute bottom-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 flex items-center gap-1 shadow-sm">
           <Clock className="w-3 h-3" /> 12 mins
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="text-[13px] font-medium text-gray-800 leading-tight line-clamp-2 mb-1 h-8">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{product.weight}</p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
             {product.originalPrice && (
               <span className="text-[10px] text-gray-400 line-through">₹{product.originalPrice}</span>
             )}
          </div>

          {quantity === 0 ? (
            <button 
              onClick={handleAddToCart}
              className="px-4 py-1.5 bg-green-50 text-brand-green border border-brand-green/30 rounded-lg text-xs font-bold uppercase hover:bg-green-100 transition-colors"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center bg-brand-green text-white rounded-lg h-8 shadow-sm">
              <button onClick={handleDecrement} className="px-2 h-full hover:bg-green-700 rounded-l-lg transition-colors">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold px-1 min-w-[16px] text-center">{quantity}</span>
              <button onClick={() => updateQuantity(product.id, 1)} className="px-2 h-full hover:bg-green-700 rounded-r-lg transition-colors">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
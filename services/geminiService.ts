import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AgentResponse, AgentActionType } from '../types';

let genAI: GoogleGenAI | null = null;
const imageCache: Record<string, string> = {};

// Backend API URL from environment variables
const BACKEND_URL = import .meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Queue system to manage concurrency and rate limits for images
const generationQueue: Array<{
  productId: string;
  productName: string;
  description: string;
  resolve: (url: string | null) => void;
}> = [];
let isProcessingQueue = false;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

/* --- IMAGE GENERATION --- */

export const getCachedImage = (productId: string): string | undefined => {
  return imageCache[productId];
};

const processQueue = async () => {
  if (isProcessingQueue || generationQueue.length === 0) return;

  isProcessingQueue = true;
  const task = generationQueue.shift();

  if (!task) {
    isProcessingQueue = false;
    return;
  }

  try {
    if (imageCache[task.productId]) {
      task.resolve(imageCache[task.productId]);
    } else {
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: `Create a high-quality, professional product photography image of ${task.productName}. 
                     Context: ${task.description}. 
                     The image should be isolated on a clean white or light gray background, suitable for a modern grocery delivery app. 
                     Ensure the product is centered and well-lit. Commercial food photography style.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let imageUrl: string | null = null;
      // Use the correct response structure for the SDK
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64String = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mimeType};base64,${base64String}`;
            break;
          }
        }
      }


      if (imageUrl) {
        imageCache[task.productId] = imageUrl;
        task.resolve(imageUrl);
      } else {
        task.resolve(null);
      }
    }
  } catch (error) {
    console.error(`Failed to generate image for ${task.productName}:`, error);
    task.resolve(null);
  } finally {
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 2000);
  }
};

export const generateProductImage = (productId: string, productName: string, description: string): Promise<string | null> => {
  if (imageCache[productId]) return Promise.resolve(imageCache[productId]);
  return new Promise((resolve) => {
    generationQueue.push({ productId, productName, description, resolve });
    processQueue();
  });
};

/* --- BACKEND VALIDATION --- */

export const validateProductWithBackend = async (productName: string): Promise<{ exists: boolean; price?: number }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/merchant/validate_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name: productName })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { exists: true, price: data.price };
    }
    return { exists: false };
  } catch (error) {
    console.warn('Backend validation unavailable, using client-side only', error);
    return { exists: false };
  }
};

export const logAgentActionToBackend = async (action: string, details: any): Promise<void> => {
  try {
    await fetch(`${BACKEND_URL}/merchant/log_agent_action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, timestamp: new Date().toISOString() })
    });
  } catch (error) {
    console.warn('Could not log to backend', error);
  }
};


/* --- SHOPPING AGENT (Chat) --- */

export const createShoppingChat = (productList: string[]): Chat => {
  const ai = getGenAI();
  
  const systemPrompt = `
    You are an intelligent shopping assistant for 'Blinkit' powered by Agent Payments Protocol (AP2).
    
    **Available Products**: ${productList.join(', ')}.
    
    **Your Responsibilities**:
    1. Help users find and add products to their cart through natural conversation
    2. Verify product availability (only suggest products from the Available Products list)
    3. Always ask for quantity if not specified
    4. Confirm items before adding to cart
    5. Guide users to checkout when ready
    
    **Workflow**:
    1. **QUESTION**: If user query is unclear, ask for clarification
    2. **IDENTIFY**: Check if requested product exists in Available Products
    3. **PROPOSE_CART**: Once product & quantity confirmed, propose adding to cart
    4. **ADD_TO_CART**: User confirms → add items to cart with this type
    5. **INITIATE_CHECKOUT**: When user wants to pay
    6. **INFO**: For general information or when products unavailable
    
    **Important Rules**:
    - Only suggest products from the Available Products list
    - Always get quantity from user
    - Be conversational and helpful
    - Guide users smoothly to checkout

    Output Schema:
    You must always return a JSON object with this schema:
    {
      "type": "QUESTION" | "PROPOSE_CART" | "ADD_TO_CART" | "INITIATE_CHECKOUT" | "INFO",
      "message": "The text string to show the user",
      "items": [ { "productName": "Exact Product Name", "quantity": 1 } ] (Optional, required for PROPOSE_CART and ADD_TO_CART)
    }
  `;

  return ai.chats.create({
    model: "gemini-3-pro-preview",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { 
            type: Type.STRING, 
            enum: [
              AgentActionType.QUESTION, 
              AgentActionType.PROPOSE_CART, 
              AgentActionType.ADD_TO_CART, 
              AgentActionType.INITIATE_CHECKOUT, 
              AgentActionType.INFO
            ] 
          },
          message: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
              },
              required: ["productName", "quantity"]
            }
          }
        },
        required: ["type", "message"]
      }
    }
  });
};
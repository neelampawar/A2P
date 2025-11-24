import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AgentResponse, AgentActionType } from '../types';

let genAI: GoogleGenAI | null = null;
const imageCache: Record<string, string> = {};

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
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

/* --- IMAGE GENERATION (Unchanged) --- */

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
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64String = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${base64String}`;
          break;
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

/* --- SHOPPING AGENT (Chat) --- */

export const createShoppingChat = (productList: string[]): Chat => {
  const ai = getGenAI();
  
  const systemPrompt = `
    You are an intelligent shopping assistant for 'Cymbal Retail'.
    Available Products: ${productList.join(', ')}.
    
    Your goal is to help the user build a cart through a natural conversation.
    
    Protocol:
    1. **Identify**: When user asks for a product, check if it exists in the Available Products list.
    2. **Quantity Check**: If the user does not specify a quantity (e.g., "I want milk"), you MUST ask for it (e.g., "How many packets of Amul Taaza Milk (500ml) would you like?").
    3. **Proposal**: Once you have the product and quantity, do NOT add it immediately. Instead, propose the action: "I've found [Product]. Shall I add [Quantity] to your cart?". Set type='PROPOSE_CART'.
    4. **Action**: If the user confirms (e.g., "yes", "sure", "ok"), generate a response with type='ADD_TO_CART' containing the items. The message should say "Added [Product] to your cart. Anything else, or are you ready to checkout?".
    5. **Checkout**: If the user indicates they want to pay or checkout, generate a response with type='INITIATE_CHECKOUT'.
    6. **Clarify**: If a product is not found, suggest the closest match or apologize. Set type='INFO'.

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
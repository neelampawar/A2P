import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponse } from '../types';

let genAI: GoogleGenAI | null = null;
const imageCache: Record<string, string> = {};

// Queue system to manage concurrency and rate limits
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
    // Check cache again just in case
    if (imageCache[task.productId]) {
      task.resolve(imageCache[task.productId]);
    } else {
      const ai = getGenAI();
      // Using gemini-2.5-flash-image (Nano Banana) for image generation
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
    // Add a 2-second delay between processing requests to avoid hitting rate limits (429)
    setTimeout(() => {
      isProcessingQueue = false;
      processQueue();
    }, 2000);
  }
};

export const generateProductImage = (productId: string, productName: string, description: string): Promise<string | null> => {
  // Check cache first
  if (imageCache[productId]) return Promise.resolve(imageCache[productId]);

  return new Promise((resolve) => {
    generationQueue.push({ productId, productName, description, resolve });
    processQueue();
  });
};

export const getShoppingSuggestions = async (userQuery: string, productList: string[]): Promise<AgentResponse> => {
  try {
    const ai = getGenAI();
    const systemPrompt = `
      You are an intelligent shopping assistant for a grocery app. 
      Your goal is to match the user's request (e.g., "I want to cook pasta") to the available products list.
      
      Available Products: ${productList.join(', ')}

      Return a JSON response with:
      1. 'items': An array of objects, each containing 'productName' (must match exactly one from the available list) and 'reason' (short explanation).
      2. 'thoughtProcess': A brief string explaining your choices.

      If a product isn't explicitly in the list but is needed, try to find the closest substitute in the list or ignore it.
      Return ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
                required: ["productName", "reason"]
              }
            },
            thoughtProcess: { type: Type.STRING }
          },
          required: ["items", "thoughtProcess"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    return JSON.parse(jsonText) as AgentResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      items: [],
      thoughtProcess: "I'm having trouble connecting to the brain right now. Please try browsing manually."
    };
  }
};
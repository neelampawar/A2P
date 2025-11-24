export enum Category {
  VEGETABLES = 'Vegetables & Fruits',
  DAIRY = 'Dairy & Breakfast',
  SNACKS = 'Munchies',
  DRINKS = 'Cold Drinks & Juices',
  INSTANT = 'Instant Food',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  weight: string;
  category: Category;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export enum PaymentStep {
  IDLE = 'IDLE',
  IDENTIFYING = 'IDENTIFYING', // Agent Handshake
  CREATING_INTENT = 'CREATING_INTENT', // Transaction Intent
  PROCESSING = 'PROCESSING', // Card Execution
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

// Updated Agent Types for Multi-turn Conversation
export enum AgentActionType {
  QUESTION = 'QUESTION', // Ask for more details (quantity, etc.)
  PROPOSE_CART = 'PROPOSE_CART', // Suggest items to add, ask for confirmation
  ADD_TO_CART = 'ADD_TO_CART', // Action to add items after confirmation
  INITIATE_CHECKOUT = 'INITIATE_CHECKOUT', // Action to open payment
  INFO = 'INFO' // General response
}

export interface AgentResponse {
  type: AgentActionType;
  message: string; // The text to display to the user
  items?: Array<{
    productName: string;
    quantity: number;
  }>;
}

export interface Order {
  id: string;
  date: string;
  amount: number;
  items: { name: string; quantity: number; price: number }[];
  status: 'DELIVERED' | 'CANCELLED';
  paymentMethod: string; // e.g., "Agent (Visa ...1234)"
}

export interface SavedCard {
  last4: string;
  brand: 'Visa' | 'MasterCard' | 'Amex' | 'RuPay';
  expiry: string;
  holder: string;
  token: string; // Simulated secure token
}
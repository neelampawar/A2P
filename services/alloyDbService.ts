import { Order, SavedCard } from '../types';

// Simulating Google AlloyDB for PostgreSQL behavior using LocalStorage
// In a real production app, this would use fetch() to call a backend connected to AlloyDB.

const DB_DELAY = 600; // Simulate network latency

const STORAGE_KEYS = {
  ORDERS: 'cymbal_alloydb_orders',
  CARDS: 'cymbal_alloydb_cards'
};

export const alloyDbService = {
  
  // --- ORDER MANAGEMENT ---

  async getOrders(): Promise<Order[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
        resolve(data ? JSON.parse(data) : []);
      }, DB_DELAY);
    });
  },

  async createOrder(order: Omit<Order, 'id' | 'date' | 'status'>): Promise<Order> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder: Order = {
          ...order,
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString(),
          status: 'DELIVERED'
        };

        const existing = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const orders: Order[] = existing ? JSON.parse(existing) : [];
        const updatedOrders = [newOrder, ...orders];
        
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updatedOrders));
        resolve(newOrder);
      }, DB_DELAY);
    });
  },

  // --- CARD MANAGEMENT (Secure Token Storage) ---

  async getAuthorizedCard(): Promise<SavedCard | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEYS.CARDS);
        resolve(data ? JSON.parse(data) : null);
      }, DB_DELAY);
    });
  },

  async saveAuthorizedCard(card: Omit<SavedCard, 'token'>): Promise<SavedCard> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = `tok_ap2_${Math.random().toString(36).substr(2, 9)}`;
        const newCard: SavedCard = { ...card, token };
        
        // In this demo we only support 1 active authorized agent card
        localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(newCard));
        resolve(newCard);
      }, DB_DELAY);
    });
  },

  async revokeCardAuthorization(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.CARDS);
        resolve();
      }, DB_DELAY);
    });
  }
};
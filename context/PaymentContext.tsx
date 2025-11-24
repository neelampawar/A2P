import React, { createContext, useContext, useState, useEffect } from 'react';
import { SavedCard, Order } from '../types';
import { alloyDbService } from '../services/alloyDbService';

interface PaymentContextType {
  savedCard: SavedCard | null;
  orders: Order[];
  isLoading: boolean;
  isAgentAuthorized: boolean;
  authorizeAgent: (card: Omit<SavedCard, 'token'>) => Promise<void>;
  revokeAuthorization: () => Promise<void>;
  recordOrder: (amount: number, items: { name: string; quantity: number; price: number }[], paymentMethod: string) => Promise<void>;
  refreshData: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cardData, ordersData] = await Promise.all([
        alloyDbService.getAuthorizedCard(),
        alloyDbService.getOrders()
      ]);
      setSavedCard(cardData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Database connection failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const authorizeAgent = async (card: Omit<SavedCard, 'token'>) => {
    const newCard = await alloyDbService.saveAuthorizedCard(card);
    setSavedCard(newCard);
  };

  const revokeAuthorization = async () => {
    await alloyDbService.revokeCardAuthorization();
    setSavedCard(null);
  };

  const recordOrder = async (amount: number, items: { name: string; quantity: number; price: number }[], paymentMethod: string) => {
    const newOrder = await alloyDbService.createOrder({
      amount,
      items,
      paymentMethod
    });
    setOrders(prev => [newOrder, ...prev]);
  };

  return (
    <PaymentContext.Provider value={{ 
      savedCard, 
      orders, 
      isLoading,
      isAgentAuthorized: !!savedCard, 
      authorizeAgent, 
      revokeAuthorization,
      recordOrder,
      refreshData: loadData
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) throw new Error('usePayment must be used within a PaymentProvider');
  return context;
};
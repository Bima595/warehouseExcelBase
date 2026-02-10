'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StockWithoutDeleted } from '@/lib/stock-db';

export interface CartItem {
  stock: StockWithoutDeleted;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (stock: StockWithoutDeleted) => void;
  updateQuantity: (stockId: string, delta: number) => void;
  removeFromCart: (stockId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cashier_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cashier_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((stock: StockWithoutDeleted) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.stock.id === stock.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.stock.id === stock.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { stock, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((stockId: string, delta: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.stock.id === stockId);
      if (!item) return prevCart;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.stock.id !== stockId);
      }

      return prevCart.map((item) =>
        item.stock.id === stockId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  }, []);

  const removeFromCart = useCallback((stockId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.stock.id !== stockId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.stock.hargaJual * item.quantity, 0);
  }, [cart]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

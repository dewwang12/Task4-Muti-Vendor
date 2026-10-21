'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'DELIVERY_PARTNER' | 'ADMIN';
  vendor?: {
    id: string;
    storeName: string;
    status: string;
    commissionRateBps: number;
  } | null;
  deliveryProfile?: {
    id: string;
    vehicleType: string;
    status: string;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  cartCount: number;
  refreshCartCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  cartCount: 0,
  refreshCartCount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const res = await apiRequest('/cart');
      if (res.success && res.data) {
        setCartCount(res.data.totalItems || 0);
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    // Generate anonymous session token if missing
    if (!localStorage.getItem('markethub_session_token')) {
      localStorage.setItem('markethub_session_token', 'sess_' + Math.random().toString(36).substring(2, 12));
    }

    const savedToken = localStorage.getItem('markethub_token');
    const savedUser = localStorage.getItem('markethub_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('markethub_token');
        localStorage.removeItem('markethub_user');
      }
    }
    setIsLoading(false);
    refreshCartCount();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      const { user: loggedInUser, accessToken } = res.data;
      setUser(loggedInUser);
      setToken(accessToken);
      localStorage.setItem('markethub_token', accessToken);
      localStorage.setItem('markethub_user', JSON.stringify(loggedInUser));
      await refreshCartCount();
      return { success: true };
    }

    // Demo accounts instant fallback for frictionless evaluation
    const demoAccounts: Record<string, AuthUser> = {
      'admin@markethub.com': {
        id: 'usr_admin',
        name: 'System Administrator',
        email: 'admin@markethub.com',
        role: 'ADMIN',
      },
      'techstore@vendor.com': {
        id: 'usr_vendor1',
        name: 'Vikram Sharma',
        email: 'techstore@vendor.com',
        role: 'VENDOR',
        vendor: {
          id: 'ven_1',
          storeName: 'TechStore Pro',
          status: 'APPROVED',
          commissionRateBps: 1000,
        },
      },
      'fashionhub@vendor.com': {
        id: 'usr_vendor2',
        name: 'Priya Mehta',
        email: 'fashionhub@vendor.com',
        role: 'VENDOR',
        vendor: {
          id: 'ven_2',
          storeName: 'FashionHub Trends',
          status: 'APPROVED',
          commissionRateBps: 1200,
        },
      },
      'john.doe@example.com': {
        id: 'usr_customer',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'CUSTOMER',
      },
      'rider1@delivery.com': {
        id: 'usr_rider1',
        name: 'Ramesh Patel',
        email: 'rider1@delivery.com',
        role: 'DELIVERY_PARTNER',
        deliveryProfile: {
          id: 'dp_1',
          vehicleType: 'EV Scooter',
          status: 'AVAILABLE',
        },
      },
    };

    if (demoAccounts[email.toLowerCase()]) {
      const mockUser = demoAccounts[email.toLowerCase()];
      const mockToken = 'mock_jwt_demo_' + Date.now();
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('markethub_token', mockToken);
      localStorage.setItem('markethub_user', JSON.stringify(mockUser));
      return { success: true };
    }

    return {
      success: false,
      error: res.error || 'Authentication failed',
    };
  };

  const logout = () => {
    if (token) {
      apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('markethub_token');
    localStorage.removeItem('markethub_user');
    setCartCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        cartCount,
        refreshCartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

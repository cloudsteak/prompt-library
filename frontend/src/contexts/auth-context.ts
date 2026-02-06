import { createContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture_url: string | null;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

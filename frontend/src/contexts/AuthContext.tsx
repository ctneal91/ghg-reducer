import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types/auth';
import { api, setToken, clearSession } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ hasGuestActivities: boolean }>;
  signup: (email: string, password: string, name: string) => Promise<{ hasGuestActivities: boolean }>;
  logout: () => Promise<void>;
  claimGuestActivities: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await api.getMe();
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const hasGuestActivities = useCallback(async (): Promise<boolean> => {
    try {
      const { activities } = await api.getActivities();
      return activities.length > 0;
    } catch {
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const guestHasActivities = await hasGuestActivities();
    const { user, token } = await api.login({ email, password });
    setToken(token);
    setUser(user);
    return { hasGuestActivities: guestHasActivities };
  }, [hasGuestActivities]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const guestHasActivities = await hasGuestActivities();
    const { user, token } = await api.signup({ email, password, name });
    setToken(token);
    setUser(user);
    return { hasGuestActivities: guestHasActivities };
  }, [hasGuestActivities]);

  const logout = useCallback(async () => {
    await api.logout();
    setToken(null);
    clearSession();
    setUser(null);
  }, []);

  const claimGuestActivities = useCallback(async () => {
    const { claimed_count } = await api.claimActivities();
    clearSession();
    return claimed_count;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, claimGuestActivities }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

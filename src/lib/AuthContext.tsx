import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (passcode: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  login: () => false,
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kravo_admin_session');
    if (token === 'active') {
      setUser({ id: 'admin' });
    }
    setLoading(false);
  }, []);

  const login = (passcode: string) => {
    // Standard secure passcode for the portal
    if (passcode === 'kravo2026') {
      localStorage.setItem('kravo_admin_session', 'active');
      setUser({ id: 'admin' });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('kravo_admin_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userApi } from '../services/api';

interface User {
  id: string;
  name: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  level?: number;
  learning_topic?: string;
  target_goal?: string;
  current_level?: string;
  learning_plan?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  login: (userData: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 从localStorage中读取用户信息并从服务器刷新
  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // 从服务器刷新用户信息，确保数据最新
            await refreshUser();
          } catch (error) {
            console.error('解析用户信息失败:', error);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initUser();
  }, []);

  const refreshUser = async () => {
    try {
      // 从本地存储中读取用户信息，即使user状态为null
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      
      const parsedUser = JSON.parse(storedUser);
      const userId = user?.id || parsedUser.id;
      
      if (!userId) return;
      
      setLoading(true);
      const userData = await userApi.getUser(userId);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, loading, setUser, refreshUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Permission = {
  id: number;
  user_id: number;
  permission: string;
  permission_name: string;
  is_granted: number;
  created_at: string | null;
  updated_at: string | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string;
  role: string;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
};

export type LoginResponse = {
  success: boolean;
  message: string;
  user: User;
  permissions: Permission[];
};

interface UserContextType {
  loginData: LoginResponse | null;
  setLoginData: (data: LoginResponse | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [loginData, setLoginData] = useState<LoginResponse | null>(null);

  return (
    <UserContext.Provider value={{ loginData, setLoginData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

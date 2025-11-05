import React, { createContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken) {
    setToken(savedToken);
  }

  try {
    if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
      setUser(JSON.parse(savedUser));
    }
  } catch (err) {
    console.error("Invalid user data in localStorage, clearing...");
    localStorage.removeItem("user");
  }

  setTimeout(() => setLoading(false), 200);
}, []);

  const login = (newToken: string, newUser: any) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

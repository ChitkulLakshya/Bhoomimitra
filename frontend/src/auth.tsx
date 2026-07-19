import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Lang } from "./i18n";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL as string;
const API = `${BACKEND}/api`;

type User = {
  id: string;
  name: string;
  identifier: string;
  language: Lang;
};

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  language: Lang;
  setLanguage: (l: Lang) => void;
  signup: (n: string, id: string, pw: string) => Promise<void>;
  login: (id: string, pw: string) => Promise<void>;
  logout: () => Promise<void>;
  api: (path: string, opts?: any) => Promise<any>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Lang>("en");

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("token");
        const u = await AsyncStorage.getItem("user");
        const l = (await AsyncStorage.getItem("language")) as Lang | null;
        if (l) setLanguageState(l);
        if (t && u) {
          setToken(t);
          setUser(JSON.parse(u));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setLanguage = useCallback((l: Lang) => {
    setLanguageState(l);
    AsyncStorage.setItem("language", l).catch(() => {});
  }, []);

  const api = useCallback(
    async (path: string, opts: any = {}) => {
      const headers: any = { "Content-Type": "application/json", ...(opts.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}${path}`, { ...opts, headers });
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }
      if (!res.ok) {
        throw new Error(data?.detail || `Request failed: ${res.status}`);
      }
      return data;
    },
    [token]
  );

  const persist = async (t: string, u: User) => {
    setToken(t);
    setUser(u);
    await AsyncStorage.setItem("token", t);
    await AsyncStorage.setItem("user", JSON.stringify(u));
  };

  const signup = async (name: string, identifier: string, password: string) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, identifier, password, language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Sign up failed");
    await persist(data.token, data.user);
  };

  const login = async (identifier: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Login failed");
    await persist(data.token, data.user);
    if (data.user?.language) setLanguage(data.user.language);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove(["token", "user"]);
  };

  return (
    <Ctx.Provider value={{ user, token, loading, language, setLanguage, signup, login, logout, api }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};

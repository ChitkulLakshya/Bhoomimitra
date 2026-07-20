import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
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
    // Load local language pref first
    AsyncStorage.getItem("language").then((l) => {
      if (l) setLanguageState(l as Lang);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        // Fetch custom user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser({ ...userData, id: firebaseUser.uid });
          if (userData.language) {
            setLanguageState(userData.language);
          }
        } else {
          // Fallback if doc doesn't exist
          setUser({ id: firebaseUser.uid, name: firebaseUser.email || "User", identifier: firebaseUser.email || "", language: "en" });
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setLanguage = useCallback((l: Lang) => {
    setLanguageState(l);
    AsyncStorage.setItem("language", l).catch(() => {});
    if (user) {
      setDoc(doc(db, "users", user.id), { language: l }, { merge: true }).catch(() => {});
    }
  }, [user]);

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

  const signup = async (name: string, identifier: string, password: string) => {
    // Treat identifier as email
    const email = identifier.includes("@") ? identifier : `${identifier}@bhoomimitra.local`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const userData: User = { id: uid, name, identifier, language };
    
    // Store in Firestore
    await setDoc(doc(db, "users", uid), userData);
  };

  const login = async (identifier: string, password: string) => {
    const email = identifier.includes("@") ? identifier : `${identifier}@bhoomimitra.local`;
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
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

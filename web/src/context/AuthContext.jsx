import React, { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), id: firebaseUser.uid });
          } else {
            setUser({ id: firebaseUser.uid, email: firebaseUser.email, name: "Farmer" });
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (phone, name) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const syntheticEmail = `${cleanPhone}@bhoomimitra.app`;
    const deterministicPassword = `BhoomiMitra_Secur3_${cleanPhone}`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, deterministicPassword);
      await setDoc(doc(db, "users", cred.user.uid), {
        phone: cleanPhone,
        name,
        createdAt: new Date().toISOString()
      });
      
      // Auto-create a default plot so the scanner pipeline has a target
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'plots'), {
        owner_id: cred.user.uid,
        name: 'My Farm',
        area_acres: 1,
        crop: 'ragi',
        water_regime: 'rainfed',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        // User already exists, silently log them in
        await signInWithEmailAndPassword(auth, syntheticEmail, deterministicPassword);
      } else {
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

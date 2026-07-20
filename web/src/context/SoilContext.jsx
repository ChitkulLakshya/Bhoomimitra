import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

export const useSoil = () => useContext(SoilContext);

export const SoilProvider = ({ children }) => {
  const { user } = useAuth();
  const [soilData, setSoilData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch soil data from Firestore
  useEffect(() => {
    if (!user) {
      setSoilData(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'soil_tests'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Just take the most recent soil test (assuming sorted or just one active)
        const doc = snapshot.docs[0];
        setSoilData({ id: doc.id, ...doc.data() });
      } else {
        setSoilData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <SoilContext.Provider value={{ soilData, loading }}>
      {children}
    </SoilContext.Provider>
  );
};

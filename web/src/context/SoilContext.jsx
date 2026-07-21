import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

export const useSoil = () => useContext(SoilContext);

export const SoilProvider = ({ children }) => {
  const { user } = useAuth();
  const [soilData, setSoilData] = useState(null);
  const [allSoilData, setAllSoilData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch soil data from Firestore
  useEffect(() => {
    if (!user) {
      setSoilData(null);
      setAllSoilData([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'soil_tests'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!snapshot.empty) {
        // Just take the most recent soil test (assuming sorted or just one active) for soilData
        const doc = snapshot.docs[0];
        setSoilData({ id: doc.id, ...doc.data() });
        
        // Save all tests for profile history
        setAllSoilData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setSoilData(null);
        setAllSoilData([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);



  return (
    <SoilContext.Provider value={{ soilData, allSoilData, loading }}>
      {children}
    </SoilContext.Provider>
  );
};

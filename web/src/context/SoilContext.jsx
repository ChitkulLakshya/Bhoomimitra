import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const SoilContext = createContext();

export const useSoil = () => useContext(SoilContext);

export const SoilProvider = ({ children }) => {
  const { user } = useAuth();
  const [allSoilData, setAllSoilData] = useState([]);
  const [activeSoilTestId, setActiveSoilTestId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch soil data from Firestore
  useEffect(() => {
    if (!user) {
      setAllSoilData([]);
      setActiveSoilTestId(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'soil_tests'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setAllSoilData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setAllSoilData([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const soilData = activeSoilTestId 
    ? allSoilData.find(d => d.id === activeSoilTestId) || allSoilData[0] || null
    : allSoilData[0] || null;

  return (
    <SoilContext.Provider value={{ soilData, allSoilData, loading, setActiveSoilTestId }}>
      {children}
    </SoilContext.Provider>
  );
};

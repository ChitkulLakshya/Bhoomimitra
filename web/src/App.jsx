import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Shield, Leaf } from 'lucide-react';
import SplashScreen from './components/SplashScreen';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import NewPlot from './pages/NewPlot';
import ScanCard from './pages/ScanCard';
import Analyzing from './pages/Analyzing';
import VerifyReading from './pages/VerifyReading';
import Prescription from './pages/Prescription';
import RagiAdvisory from './pages/RagiAdvisory';
import Diagnostics from './pages/Diagnostics';
import Inventory from './pages/Inventory';
import PathComparison from './pages/PathComparison';
import Community from './pages/Community';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  return children;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Start fading out after 2.5 seconds
    const timer1 = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Completely remove splash screen from DOM after fade completes
    const timer2 = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen isFading={isFading} />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
        <main style={{ flex: 1, position: 'relative' }}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/plot/new" element={<ProtectedRoute><NewPlot /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanCard /></ProtectedRoute>} />
            <Route path="/analyzing" element={<ProtectedRoute><Analyzing /></ProtectedRoute>} />
            <Route path="/verify/:plotId" element={<ProtectedRoute><VerifyReading /></ProtectedRoute>} />
            <Route path="/prescription/:plotId/:readingId" element={<ProtectedRoute><Prescription /></ProtectedRoute>} />
            <Route path="/ragi-advisory" element={<ProtectedRoute><RagiAdvisory /></ProtectedRoute>} />
            <Route path="/diagnostics" element={<ProtectedRoute><Diagnostics /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/compare-paths" element={<ProtectedRoute><PathComparison /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default App;

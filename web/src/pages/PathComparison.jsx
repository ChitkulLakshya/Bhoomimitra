import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useSoil } from '../context/SoilContext';
import { calculatePaths } from '../utils/mathEngine';

export default function PathComparison() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { soilData } = useSoil();
  const [paths, setPaths] = useState({
    pathA: { yield: 0, cost: 0, labor: 0 },
    pathB: { yield: 0, cost: 0, labor: 0 },
    pathC: { yield: 0, cost: 0, labor: 0 }
  });

  useEffect(() => {
    if (soilData) {
      setTimeout(() => {
        setPaths(calculatePaths(soilData));
      }, 100);
    }
  }, [soilData]);

  const Gauge = ({ value, max, color }) => {
    const percentage = Math.min(value / max, 1);
    const rotation = -90 + (percentage * 180);
    return (
      <div style={{ position: 'relative', width: '60px', height: '30px', overflow: 'hidden', margin: '0 auto 8px auto' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '60px', height: '60px',
          borderRadius: '50%',
          border: `6px solid ${color}`,
          borderBottomColor: 'transparent', borderRightColor: 'transparent',
          transform: 'rotate(45deg)'
        }}></div>
        <div style={{
          position: 'absolute', bottom: '0', left: '50%', width: '3px', height: '24px',
          backgroundColor: 'var(--text-main)', transformOrigin: 'bottom center', transform: `rotate(${rotation}deg) translateX(-50%)`,
          borderRadius: '2px',
          transition: 'transform 1.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
        }}></div>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-base)', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ padding: '48px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={28} />
        </button>
        <LanguageToggle />
      </div>

      <div style={{ padding: '0 24px' }}>
        
        {/* Path Comparison Dashboard */}
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '8px', textAlign: 'center' }}>Path Comparison</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>Real-time evaluation based on your soil test parameters</p>
        
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
          
          {/* Path A */}
          <div>
            <div style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F3A033', marginBottom: '6px' }}></div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', margin: 0 }}>Path A</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Traditional</p>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Expected Yield</p>
              <Gauge value={paths.pathA.yield} max={100} color="var(--success)" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Total Input Cost</p>
              <Gauge value={paths.pathA.cost} max={100} color="var(--success)" />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Required Labor</p>
              <Gauge value={paths.pathA.labor} max={100} color="var(--error)" />
            </div>
          </div>

          {/* Path B */}
          <div>
            <div style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#95CD5B', marginBottom: '6px' }}></div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', margin: 0 }}>Path B</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Mixed</p>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Expected Yield</p>
              <Gauge value={paths.pathB.yield} max={100} color="var(--warning)" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Total Input Cost</p>
              <Gauge value={paths.pathB.cost} max={100} color="var(--warning)" />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Required Labor</p>
              <Gauge value={paths.pathB.labor} max={100} color="var(--warning)" />
            </div>
          </div>

          {/* Path C */}
          <div>
            <div style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#DB5346', marginBottom: '6px' }}></div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white', margin: 0 }}>Path C</h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Chemical</p>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Expected Yield</p>
              <Gauge value={paths.pathC.yield} max={100} color="var(--success)" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Total Input Cost</p>
              <Gauge value={paths.pathC.cost} max={100} color="var(--error)" />
            </div>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'white', marginBottom: '4px' }}>Required Labor</p>
              <Gauge value={paths.pathC.labor} max={100} color="var(--success)" />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

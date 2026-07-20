import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Lock, ScanLine } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function AuthPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError(t('Invalid Phone Number'));
      return;
    }

    setLoading(true);
    try {
      // In this mockup, signup acts as login as well based on AuthContext logic
      await signup(phone, 'Farmer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      alignItems: 'center'
    }}>
      
      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <LanguageToggle />
      </div>

      {/* Main Content Area */}
      <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile and Greeting */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>
            {t('Hello, Farmer Login 👋')}
          </h1>
        </div>

        {error && <div style={{ color: 'var(--error)', backgroundColor: 'rgba(217, 83, 79, 0.1)', padding: '12px', borderRadius: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            <Phone size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              className="input" 
              type="tel" 
              placeholder={t('Phone Number / Username')}
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: 'white',
                paddingLeft: '48px',
                borderRadius: '16px'
              }}
            />
          </div>


          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', color: '#1A1A1A' }} disabled={loading}>
            {loading ? t('Processing...') : t('Login')}
          </button>
        </form>

        {/* Scanner Card Area */}
        <div style={{ 
          backgroundColor: 'transparent', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          marginTop: '8px'
        }}>
          {/* Card Mockup */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px', height: '180px', marginBottom: '24px' }}>
            {/* The Government Card Image (Assuming it contains the scanner gun graphic) */}
            <div style={{ 
              position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              <img src="/soil_card.png" alt="Soil Card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            {/* Scanner Frame Corners */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '28px', height: '28px', borderTop: '2px solid #bce26e', borderLeft: '2px solid #bce26e', borderTopLeftRadius: '24px' }}></div>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '28px', borderTop: '2px solid #bce26e', borderRight: '2px solid #bce26e', borderTopRightRadius: '24px' }}></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '28px', height: '28px', borderBottom: '2px solid #bce26e', borderLeft: '2px solid #bce26e', borderBottomLeftRadius: '24px' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderBottom: '2px solid #bce26e', borderRight: '2px solid #bce26e', borderBottomRightRadius: '24px' }}></div>
          </div>

          <p style={{ color: 'white', fontWeight: '500', marginBottom: '16px', fontSize: '0.95rem' }}>
            {t('Or Quick-Scan to Login with Soil Card')}
          </p>

          <button 
            onClick={() => {
              navigate('/scan');
            }}
            style={{ 
              width: '100%', 
              backgroundColor: 'var(--brand-primary)', 
              color: '#1A1A1A',
              border: 'none',
              borderRadius: '30px',
              padding: '14px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t('Scan & Link Card')}
          </button>
        </div>

      </div>
    </div>
  );
}

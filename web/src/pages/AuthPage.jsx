import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Navigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';

export default function AuthPage() {
  const { user, signup } = useAuth();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError(t('InvalidPhone'));
      return;
    }

    setLoading(true);
    try {
      await signup(phone, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card glass" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <LanguageToggle />
        </div>
        <Leaf color="var(--brand-primary)" size={48} style={{ margin: '0 auto 16px' }} />
        <h1 style={{ marginBottom: '8px' }}>{t('BhoomiMitra')}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          {t('Enter your details to get started.')}
        </p>

        {error && <div style={{ color: 'var(--error)', backgroundColor: 'rgba(211, 47, 47, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label className="label">{t('Full Name')}</label>
            <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label className="label">{t('Phone Number')}</label>
            <input 
              className="input" 
              type="tel" 
              placeholder={t('e.g. 9876543210')}
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? t('Processing...') : t('Continue')}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowRight, 
  Camera, 
  ShieldCheck, 
  CloudSun, 
  Sparkles, 
  Leaf,
  Smartphone
} from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';

export default function AuthPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
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
      await signup(phone, name || 'Farmer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#F8FAF6',
      backgroundImage: `
        radial-gradient(circle at 15% 15%, rgba(84, 110, 63, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(255, 241, 84, 0.12) 0%, transparent 50%)
      `,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif"
    }}>

      {/* Floating subtle background leaf patterns */}
      <div style={{ position: 'absolute', top: '40px', left: '24px', opacity: 0.12, pointerEvents: 'none' }}>
        <Leaf size={48} color="#3B532B" />
      </div>
      <div style={{ position: 'absolute', bottom: '60px', right: '28px', opacity: 0.1, transform: 'rotate(45deg)', pointerEvents: 'none' }}>
        <Leaf size={64} color="#546E3F" />
      </div>

      {/* Top Header: Brand Title & Language Switcher */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #546E3F, #3B532B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(84, 110, 63, 0.2)'
          }}>
            <Leaf size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2C3A20', letterSpacing: '-0.3px' }}>
            Bhoomi<span style={{ color: '#546E3F' }}>Mitra</span>
          </span>
        </div>

        <LanguageToggle style={{ 
          backgroundColor: '#FFFFFF',
          color: '#3B532B',
          border: '1px solid #E2E8DC',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          borderRadius: '20px',
          fontWeight: '600',
          fontSize: '0.82rem'
        }} />
      </div>

      {/* Main Login Card (White, Airy, Soft Shadow) */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        padding: '32px 28px',
        boxShadow: '0 20px 40px rgba(44, 58, 32, 0.06), 0 2px 6px rgba(0, 0, 0, 0.02)',
        border: '1px solid #EEF3E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        transition: 'transform 0.3s ease'
      }}>

        {/* Farming Hero Illustration Header */}
        <div style={{
          width: '100%',
          height: '140px',
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: '24px',
          background: 'linear-gradient(180deg, #EBF3E4 0%, #F5F9F0 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end'
        }}>
          {/* Subtle sun element in illustration background */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '20%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 241, 84, 0.5)',
            filter: 'blur(8px)'
          }} />

          {/* Clean farmer illustration image */}
          <img 
            src="/welcome_farmer.png" 
            alt="Farming Illustration"
            style={{
              height: '150px',
              objectFit: 'contain',
              marginBottom: '-10px',
              filter: 'drop-shadow(0 8px 16px rgba(59, 83, 43, 0.15))'
            }} 
          />
        </div>

        {/* Heading & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '24px', width: '100%' }}>
          <h1 style={{
            fontSize: '1.7rem',
            fontWeight: '800',
            color: '#1C2615',
            marginBottom: '6px',
            letterSpacing: '-0.5px'
          }}>
            {t('Welcome 👋')}
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: '#667757',
            lineHeight: '1.45',
            fontWeight: '500'
          }}>
            {t('Welcome Back Subtitle')}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            width: '100%',
            backgroundColor: '#FDF2F2',
            border: '1px solid #F8D7D7',
            color: '#D9534F',
            padding: '12px 16px',
            borderRadius: '16px',
            fontSize: '0.88rem',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Full Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
            <label style={{
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#4A5B3B',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {t('Full Name')}
            </label>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F7FAF4',
              border: isNameFocused ? '2px solid #546E3F' : '1.5px solid #E2EAD8',
              borderRadius: '20px',
              padding: '6px 16px',
              transition: 'all 0.2s ease',
              boxShadow: isNameFocused ? '0 0 0 4px rgba(84, 110, 63, 0.1)' : 'none'
            }}>
              <input
                type="text"
                placeholder={t('Enter your full name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsNameFocused(true)}
                onBlur={() => setIsNameFocused(false)}
                required
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#1C2615',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  padding: '10px 0',
                  letterSpacing: '0.5px'
                }}
              />
              <Sparkles size={20} color="#8A9E79" />
            </div>
          </div>
          
          {/* Phone Input Box with +91 Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{
              fontSize: '0.78rem',
              fontWeight: '700',
              color: '#4A5B3B',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              {t('Phone Number')}
            </label>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F7FAF4',
              border: isPhoneFocused ? '2px solid #546E3F' : '1.5px solid #E2EAD8',
              borderRadius: '20px',
              padding: '6px 16px',
              transition: 'all 0.2s ease',
              boxShadow: isPhoneFocused ? '0 0 0 4px rgba(84, 110, 63, 0.1)' : 'none'
            }}>
              {/* Country Code Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingRight: '12px',
                borderRight: '1.5px solid #DAE3CE',
                marginRight: '12px',
                color: '#2C3A20',
                fontWeight: '700',
                fontSize: '0.95rem',
                userSelect: 'none'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
                <span>+91</span>
              </div>

              {/* Input Element */}
              <input
                type="tel"
                pattern="[0-9]*"
                maxLength="10"
                placeholder={t('Phone Number / Username')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                required
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#1C2615',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  padding: '10px 0',
                  letterSpacing: '0.5px'
                }}
              />
              <Smartphone size={20} color="#8A9E79" />
            </div>
          </div>

          {/* Primary Green Gradient Continue Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #546E3F 0%, #3B532B 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '20px',
              padding: '16px 24px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 24px rgba(59, 83, 43, 0.25)',
              transition: 'all 0.25s ease',
              opacity: loading ? 0.8 : 1
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 28px rgba(59, 83, 43, 0.32)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(59, 83, 43, 0.25)';
              }
            }}
          >
            {loading ? t('Processing...') : (
              <>
                <span>{t('Login')}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>



      </div>

      {/* Trust Indicators at Bottom (AI Guidance, Live Weather, 100% Secure) */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginTop: '24px',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Indicator 1 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFF4EA',
          borderRadius: '16px',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#F4F9EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={16} color="#546E3F" />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2C3A20' }}>
            {t('AI Recommendations')}
          </span>
        </div>

        {/* Indicator 2 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFF4EA',
          borderRadius: '16px',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#FFFDE6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CloudSun size={16} color="#D4B200" />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2C3A20' }}>
            {t('Live Weather')}
          </span>
        </div>

        {/* Indicator 3 */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFF4EA',
          borderRadius: '16px',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#F4F9EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} color="#3B532B" />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2C3A20' }}>
            {t('Secure Login')}
          </span>
        </div>
      </div>

    </div>
  );
}
